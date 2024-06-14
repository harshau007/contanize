export namespace main {
	
	export class PortForwardingRule {
	    container_name: string;
	    container_id: string;
	    container_port: string;
	    host_port: string;
	
	    static createFrom(source: any = {}) {
	        return new PortForwardingRule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.container_name = source["container_name"];
	        this.container_id = source["container_id"];
	        this.container_port = source["container_port"];
	        this.host_port = source["host_port"];
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

