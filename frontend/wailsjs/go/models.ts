export namespace main {
	
	export class CPUStats {
	    time: string;
	    usage: string;
	
	    static createFrom(source: any = {}) {
	        return new CPUStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.time = source["time"];
	        this.usage = source["usage"];
	    }
	}
	export class ContainerMetrics {
	    cpuUsage: string;
	    memoryUsage: string;
	    networkInput: string;
	    networkOutput: string;
	    diskIO: string;
	    runningProcesses: string;
	
	    static createFrom(source: any = {}) {
	        return new ContainerMetrics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cpuUsage = source["cpuUsage"];
	        this.memoryUsage = source["memoryUsage"];
	        this.networkInput = source["networkInput"];
	        this.networkOutput = source["networkOutput"];
	        this.diskIO = source["diskIO"];
	        this.runningProcesses = source["runningProcesses"];
	    }
	}
	export class LayerInfo {
	    id: string;
	    size: number;
	
	    static createFrom(source: any = {}) {
	        return new LayerInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.size = source["size"];
	    }
	}
	export class MemoryStats {
	    time: string;
	    usage: string;
	
	    static createFrom(source: any = {}) {
	        return new MemoryStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.time = source["time"];
	        this.usage = source["usage"];
	    }
	}
	export class containerDetail {
	    id: string;
	    name: string;
	    image: string;
	    image_id: string;
	    volume: string;
	    created: string;
	    status: string;
	    url: string;
	    public_ports: string[];
	    isdatabase: boolean;
	    dbuser: string;
	    db: string;
	    dbpass: string;
	
	    static createFrom(source: any = {}) {
	        return new containerDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.image = source["image"];
	        this.image_id = source["image_id"];
	        this.volume = source["volume"];
	        this.created = source["created"];
	        this.status = source["status"];
	        this.url = source["url"];
	        this.public_ports = source["public_ports"];
	        this.isdatabase = source["isdatabase"];
	        this.dbuser = source["dbuser"];
	        this.db = source["db"];
	        this.dbpass = source["dbpass"];
	    }
	}
	export class imageDetail {
	    repository: string;
	    tag: string;
	    image_id: string;
	    created: string;
	    size: string;
	    arch: string;
	    os: string;
	
	    static createFrom(source: any = {}) {
	        return new imageDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.repository = source["repository"];
	        this.tag = source["tag"];
	        this.image_id = source["image_id"];
	        this.created = source["created"];
	        this.size = source["size"];
	        this.arch = source["arch"];
	        this.os = source["os"];
	    }
	}

}

