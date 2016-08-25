import * as Backbone from 'backbone';
import { LocalizedString } from 'ontodia/src/ontodia/data/model';
import * as Messaging from './imessaging';
import {MiddleModelElement} from './isc-middle-model';

export default class ISTitleMap {
    public map:{[id:string]:string};
    public priorityList:string[];
    public id:string;
    
    public init(callback:(response: any) => void){
        var self = this;
        this.fetchMap(function(data){
            self.map = data;
            callback(data);
        });
    }
    
    constructor(public serviceUrl: string,
                public headers: { [name: string]: string },
                public namespace: string){
        this.map = {};
        this.priorityList = this.getPriorityList();
        this.id = "_id";
    }
    
    private fetchMap(callback:(response: any) => void){
        var self = this;
        $.ajax({
          type: "GET",
          url: self.serviceUrl + 'intersystemsapi/GetClassTree?namespace=' + self.namespace,
          headers: self.headers,
          success: callback,
          error: callback
        });
    }
        
    private getPriorityList():string[]{
        return ["Name",
                "Title", 
                "FirstName",
                "LastName",
                "Model",
                "Serial",
                "Identifier"];
    }
    
    public extractTitle(instance:any, instclass?:string, id?:string):{ values: LocalizedString[] }{
        var title:{ values: LocalizedString[] } = null;
        if(!id) id = (instance[this.id]? instance[this.id]: "none");
        if(!instclass) instclass = (instance["_class"]?instance["_class"]:"any");
        
        if(instclass && this.map[instclass] && instance[this.map[instclass]]){
            title = { values: [ { lang: "en", text: instance[this.map[instclass]] + " (ID:"+id+")" } ] };
        }else{
            for(var i=0; i<this.priorityList.length; i++){
                if(instance[this.priorityList[i]]){
                    title = { values: [ { lang: "en", text: instance[this.priorityList[i]] + " (ID:"+id+")" } ] };
                    break;
                }
            }
        }
        
        if(!title){
            var key = Object.keys(instclass).filter(k => 
                            this.priorityList.filter(p=> 
                                k.toLowerCase().indexOf(p.toLowerCase())!=-1
                            ).length>0
                        )[0];
            if(key) title = { values: [ { lang: "en", text: instance[key] + " (ID:"+id+")" } ] };
        }
        
        if(!title){
            title = { values: [ { lang: "en", text: instclass + " (ID:"+id+")" } ] };
        }
        return title;
    }
}

