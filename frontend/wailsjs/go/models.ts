export namespace main {
	
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
	    }
	}
	export class imageDetail {
	    repository: string;
	    tag: string;
	    image_id: string;
	    created: string;
	    size: string;
	
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
	    }
	}

}

