package services

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

type ContainerInfo struct {
	ContainerID string `yaml:"container_id"`
	Name        string `yaml:"name"`
	Image       string `yaml:"image"`
	Ports       []int  `yaml:"ports"`
	Volume      string `yaml:"volume"`
	Template    string `yaml:"template"`
}

type Database []ContainerInfo

type Transaction struct {
	db       *Database
	filename string
	tempFile string
}

func NewTransaction(filename string) (*Transaction, error) {
	if err := ensureFileExists(filename); err != nil {
		return nil, fmt.Errorf("error ensuring file exists: %v", err)
	}

	db, err := readDatabase(filename)
	if err != nil {
		return nil, err
	}

	dir, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	tempFile := filepath.Join(dir, fmt.Sprintf("%s.tmp", filepath.Base(filename)))
	return &Transaction{
		db:       db,
		filename: filename,
		tempFile: tempFile,
	}, nil
}

func ensureFileExists(filename string) error {
	_, err := os.Stat(filename)
	if os.IsNotExist(err) {
		log.Printf("File %s does not exist. Creating it with an empty database.", filename)
		emptyDB := &Database{}
		return writeDatabase(filename, emptyDB)
	}
	return err
}

func (t *Transaction) commit() error {
	// Write to temp file
	if err := writeDatabase(t.tempFile, t.db); err != nil {
		return fmt.Errorf("failed to write to temp file: %v", err)
	}

	// Rename temp file to original file (atomic operation)
	if err := os.Rename(t.tempFile, t.filename); err != nil {
		return fmt.Errorf("failed to rename temp file: %v", err)
	}

	return nil
}

func (t *Transaction) rollback() {
	os.Remove(t.tempFile)
}

func readDatabase(filename string) (*Database, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("error reading file: %v", err)
	}

	var db Database
	err = yaml.Unmarshal(data, &db)
	if err != nil {
		return nil, fmt.Errorf("error unmarshaling YAML: %v", err)
	}

	return &db, nil
}

func writeDatabase(filename string, db *Database) error {
	data, err := yaml.Marshal(db)
	if err != nil {
		return fmt.Errorf("error marshaling YAML: %v", err)
	}

	err = os.WriteFile(filename, data, 0644)
	if err != nil {
		return fmt.Errorf("error writing file: %v", err)
	}

	return nil
}

func (t *Transaction) CreateEntry(ContainerInfo ContainerInfo) {
	*t.db = append(*t.db, ContainerInfo)
	log.Printf("Created new ContainerInfo: %s", ContainerInfo.Name)
}

func (t *Transaction) ReadEntry(name string) (*ContainerInfo, bool) {
	for _, ContainerInfo := range *t.db {
		if ContainerInfo.Name == name {
			log.Printf("Found ContainerInfo: %s", name)
			return &ContainerInfo, true
		}
	}
	log.Printf("ContainerInfo not found: %s", name)
	return nil, false
}

func (t *Transaction) UpdateEntry(id string, updatedEntry ContainerInfo) bool {
	for i, ContainerInfo := range *t.db {
		if strings.Contains(ContainerInfo.ContainerID, id) {
			(*t.db)[i] = updatedEntry
			log.Printf("Updated ContainerInfo: %s", id)
			return true
		}
	}
	log.Printf("Failed to update ContainerInfo: %s (not found)", id)
	return false
}

func (t *Transaction) DeleteEntry(id string) bool {
	for i, ContainerInfo := range *t.db {
		if strings.Contains(ContainerInfo.ContainerID, id) {
			*t.db = append((*t.db)[:i], (*t.db)[i+1:]...)
			log.Printf("Deleted ContainerInfo: %s", id)
			return true
		}
	}
	log.Printf("Failed to delete ContainerInfo: %s (not found)", id)
	return false
}

func (t *Transaction) ReadEntryById(id string) (*ContainerInfo, bool) {
	for _, ContainerInfo := range *t.db {
		if strings.Contains(ContainerInfo.ContainerID, id) {
			return &ContainerInfo, true
		}
	}
	return nil, false
}
