import { ClassModel } from 'ontodia/src/ontodia/data/model';
import * as Models from 'ontodia/src/ontodia/data/model';
import * as Messages from './server';
import ISTitleMap from './isc-title-map';

export interface MiddleModelElement extends Models.ElementModel {
    iscacheInfo?: ISCaheClass;
}

export interface ISCaheClass {
    Super?: string;
    Name: string;
    parameters?: {[Name: string]: any};
    properties?: {[Name: string]: {Name: string, Type: string}};
}

export default class MiddleModel {
  public packagesTree: Messages.ClassTreeResponse;

  public elementInstancesMap: {[typeId: string]: MiddleModelElement[] };
  public instances: {[typeId: string]: {ID: string, data?: any} };

  public elementsMap: {[id: string]: MiddleModelElement };
  public packageElementsMap: {[typeId: string]: MiddleModelElement[] };

  public linkTypes: Models.LinkType[];
  public modelLinks: Models.LinkModel[];

  private mapperObj: ISTitleMap;
//   private serviceUrl = 'intersystemsapi'//'http://198.211.125.30:57772';

  constructor(public serviceUrl: string,
              public headers: { [name: string]: string },
              public namespace: string) {
        this.packageElementsMap = {};
        this.elementInstancesMap = {};
        this.instances = {};
        this.elementsMap = {};
        this.mapperObj = new ISTitleMap(this.serviceUrl, this.headers, namespace);
  }

  public sendRequest(topic: string,
                     request: any,
                     onSuccess: (response: any) => void,
                     onError: (response: any) => void) {
         switch(topic) {
             case 'diagrams_data_elements':
                 this.getDiagramElements(onSuccess, onError);
                 break;
             case 'diagrams_data_links':
                 this.getDiagramLinks(onSuccess, onError);
                 break;
             case 'sources_data_elementsInfo':
                 this.getElementsInfo(request, onSuccess, onError);
                 break;
             case 'sources_data_sparqlQuery':
                 this.getSparqlQuery(onSuccess, onError);
                 break;
             case 'sources_data_linksInfo':
                 this.getLinksInfo(request, onSuccess, onError);
                 break;
             case 'sources_data_filter':
                 this.doFilter(request, onSuccess, onError);
                 break;
             case 'sources_data_classes':
                 this.getClassTree(request, onSuccess, onError);
                 break;
             case 'sources_data_dsTitle':
                 this.getDsTitle(onSuccess, onError);
                 break;
             case 'sources_data_linkTypes':
                 this.getLinkTypes(request, onSuccess, onError);
                 break;
             case 'sources_data_linkTypesOf':
                 this.getLinkTypesOf(request, onSuccess, onError);
                 break;
             case 'shared_data':
                 this.getSharedData(onSuccess, onError);
                 break;
             case 'sharedDS_data':
                 this.getSharedDSData(onSuccess, onError);
                 break;
         }
  }

  // ==========================================================================
  public getDiagramElements(onSuccess: (response: any) => void,
                            onError: (response: any) => void) {
        onSuccess({ elements: [] });
  }
  // ==========================================================================
  public getDiagramLinks(onSuccess: (response: any) => void,
                         onError: (response: any) => void) {
        onSuccess({ links: [] });
  }
  // ==========================================================================
  public getElementsInfo(request: Messages.ElementsInfoRequest,
                         onSuccess: (response: any) => void,
                         onError: (response: any) => void) {
         let resonse: Messages.ElementsResponse = {
            requestId: request.requestId,
            elements: {}
         };

         let progressCounter = 0;
         request.elementIds.forEach(eid => {
           if(this.elementsMap[eid]) {
               resonse.elements[eid] = this.elementsMap[eid];
               if (this.isInstance(eid) &&
                  (!this.instances[eid].data || Object.keys(this.elementsMap[eid].properties).length === 0)) {

                   this.enrichInstance(eid, function(data) {
                       progressCounter++;
                       if (progressCounter >= request.elementIds.length) {
                           onSuccess(resonse);
                       }
                   }, this.instances[eid].data);

               } else {
                   progressCounter++;
               }
           }
         });
         if(progressCounter >= request.elementIds.length) {
             onSuccess(resonse);
         }
  }

  private enrichInstance(eid: string, onSuccess: (response: any) => void, data?:any) {
        let element = this.elementsMap[eid];
        let inst: {ID: string, data?:any} = this.instances[eid];

        let enrich = function(data?: any) {
            inst.data = data;
            element.iscacheInfo = data;
            for(let prop in data) {
                if(typeof(data[prop]) === 'string' && data[prop]) {
                    element.properties[prop] = [{ type: 'string', value: { lang: 'en', text: data[prop] } }];
                }
            }
            onSuccess(element);
        };
        if(data) {
            enrich(data);
        }else {
            this.sendInstanceInfoRequest(inst.ID, element.types[0], enrich);
        }

  }

  // ==========================================================================
  public getSparqlQuery(onSuccess: (response: any) => void,
                        onError: (response: any) => void) {
        onSuccess([]);
  }
  // ==========================================================================
  public getLinksInfo(request:Messages.LinksInfoRequest,
                      onSuccess: (response: any) => void,
                      onError: (response: any) => void) {
        let self = this;
        let sendResponse = function(additionalLinks?:Models.LinkModel[]) {
            let resonse: Messages.LinksResponse = {
                requestId: request.requestId,
                links:[]
            };

            for(let i = 0; i < self.modelLinks.length; i++) {
                if((request.elementIds   && request.elementIds.indexOf(self.modelLinks[i].sourceId)     !== -1) &&
                    (request.elementIds   && request.elementIds.indexOf(self.modelLinks[i].targetId)    !== -1) &&
                    (!request.linkTypeIds || request.linkTypeIds.indexOf(self.modelLinks[i].linkTypeId) !== -1)) {
                        resonse.links.push(self.modelLinks[i]);
                    }
            }

            if(additionalLinks) {
                for(let i = 0; i < additionalLinks.length; i++) {
                    if((request.elementIds   && request.elementIds.indexOf(additionalLinks[i].sourceId)     !== -1)&&
                        (request.elementIds   && request.elementIds.indexOf(additionalLinks[i].targetId)    !== -1)&&
                        (!request.linkTypeIds || request.linkTypeIds.indexOf(additionalLinks[i].linkTypeId) !== -1)) {
                            resonse.links.push(additionalLinks[i]);
                        }
                }
            }
            onSuccess(resonse);
        };

        let progressCounter = 0;
        let resultData:Models.LinkModel[] = [];
        request.elementIds.forEach(eid =>{
            if(this.elementsMap[eid]) {
                if(this.isInstance(eid)) {
                    this.getLinksOfInstance(eid, function(data) {
                        progressCounter++;
                        resultData = resultData.concat(data);
                        if(progressCounter>=request.elementIds.length) {
                            sendResponse(resultData);
                        }
                    }, this.instances[eid].data);
                }else {
                    progressCounter++;
                }
            }
        });

        if(progressCounter>=request.elementIds.length) {
            sendResponse();
        }
  }

  private getRelatedClasses(id): MiddleModelElement[]{
        let classLinks = this.getLinksOfElement(id);
        let repeatedRelatedElements = classLinks.map(link => (link.sourceId!==id? 
                                                     this.elementsMap[link.sourceId]: 
                                                     this.elementsMap[link.targetId] ))
                                                    .filter(el => el.types[0] === 'class');
        let result:MiddleModelElement[] = [];
        repeatedRelatedElements.forEach(el => {
            if(result.map(rel => rel.id).indexOf(el.id)==-1) result.push(el);
        });
        return result; 
  }

  private getLinksOfInstance(
      eid: string,
      onSuccess: (response: Models.LinkModel[]) => void,
      data?: any,
      linkId?: string) {
        let element = this.elementsMap[eid];
        let inst: {ID: string, data?:any} = this.instances[eid];
        let self = this;

        let getLinks = function(data) {
            inst.data = data;
            element.iscacheInfo = data;

            let foundedLinks:Models.LinkModel[] = [];

            let getLinksBySource = function(instanceId, type, foundedLinks) {
                let classLinks = self.getLinksOfElement(type);

                let props = self.elementsMap[type].properties;
                if(props){
                    for (let p in props) {
                        let prop = props[p];
                        let targetId = null;
                        let targetClassId = null;
                        if(inst.data[p] instanceof Array && inst.data[p].length>0) {
                            targetClassId = inst.data
                            targetClassId = inst.data[p][0]['_class'];
                            for(let i=0; i<inst.data[p].length; i++) {
                                targetId = null
                                targetId = 'instanceof.' + targetClassId + '.' + inst.data[p][i]['_id'];
                                if(targetId && self.elementsMap[targetId]) {
                                    for(let i=0; i<classLinks.length; i++) {
                                        if(classLinks[i].targetId === targetClassId && classLinks[i].sourceId === type) {
                                            foundedLinks.push({
                                                linkTypeId: classLinks[i].linkTypeId,
                                                sourceId: instanceId,
                                                targetId: targetId
                                            });
                                            break;
                                        }
                                    }
                                }
                            }
                        }else if(inst.data[p] instanceof Object) {
                            targetClassId = inst.data[p]['_class'];
                            targetId = 'instanceof.' + targetClassId + '.' + inst.data[p]['_id'];
                            if(targetId && self.elementsMap[targetId]) {
                                for(let i=0; i<classLinks.length; i++) {
                                    if(classLinks[i].targetId === targetClassId && classLinks[i].sourceId === type) {
                                        foundedLinks.push({
                                            linkTypeId: classLinks[i].linkTypeId,
                                            sourceId: instanceId,
                                            targetId: targetId
                                        });
                                        break;
                                    }
                                }
                            }
                        }
                        if(targetId && self.elementsMap[targetId]) {
                            for(let i=0; i<classLinks.length; i++) {
                                if(classLinks[i].targetId === targetClassId && classLinks[i].sourceId === type) {
                                    foundedLinks.push({
                                        linkTypeId: classLinks[i].linkTypeId,
                                        sourceId: instanceId,
                                        targetId: targetId
                                    });
                                    break;
                                }
                            }
                        }
                    }
                }
            };
            getLinksBySource(eid, element.types[0], foundedLinks);
            
            onSuccess(foundedLinks.filter(l => !linkId || l.linkTypeId===linkId));
        };
        if(data) {
            getLinks(data);
        }else {
            this.sendInstanceInfoRequest(inst.ID, element.types[0], getLinks);
        }
  }
  
  private getLinksOfElement(id: string, linkId?: string, getOnlySource?:boolean, getOnlyTarget?:boolean):Models.LinkModel[]{
    let links:Models.LinkModel[] = [];
    if(this.modelLinks) {
      for(let i=0; i<this.modelLinks.length; i++) {
         if(((!getOnlyTarget && this.modelLinks[i].sourceId === id) ||
             (!getOnlySource && this.modelLinks[i].targetId === id))&&
             (!linkId || this.modelLinks[i].linkTypeId === linkId)) {
                links.push(this.modelLinks[i]);
             }
      }
    }
    return links;
  }

  // ==========================================================================
  public doFilter(request: Messages.FilterRequest,
                  onSuccess: (response: any) => void,
                  onError: (response: any) => void) {
        this.getFilterElements(request, onSuccess);
  }
  // ==========================================================================
  public getClassTree(request: Messages.RpcRequest,
                      onSuccess: (response: any) => void,
                      onError?: (response: any) => void) {
      if(!this.packagesTree) {
          this.fetchClassTree(request,
            function() {
              onSuccess(this.packagesTree);
            }, onError);
      }else {
          onSuccess(this.packagesTree);
      }
      return;
  };
  // ==========================================================================
  public getDsTitle(onSuccess: (response: any) => void,
                         onError: (response: any) => void) {
        onSuccess({ values: [ { lang: 'en', text: 'Test diagram'} ] });
  }
  // ==========================================================================
  public getLinkTypes(request: Messages.RpcRequest,
                      onSuccess: (response: any) => void,
                      onError: (response: any) => void) {
        let response:Messages.LinkTypesResponse = {
            requestId: request.requestId,
            linkTypes: this.linkTypes
        };
        onSuccess(response);
  }

  public getLinkTypesById(id: string): Models.LinkType {
      for (let i = 0; i < this.linkTypes.length; i++) {
          if (this.linkTypes[i].id === id) {
              return this.linkTypes[i];
          }
      }
      return null;
  }

  private getLinkTypesIdOfElement(id: string, onSuccess: (response: any) => void) {
        let links: Models.LinkModel[] = this.getLinksOfElement(id);
        let types: { id: string, count: number }[] = [];

        for(let i = 0; i < links.length; i++) {
            let index = types.map(t => t.id).indexOf(links[i].linkTypeId);
            if(index === -1) {
                let type = this.getLinkTypesById(links[i].linkTypeId);
                if (type) {
                    types.push({id: type.id, count: 1});
                }
            }else {
                types[index].count++;
            }
        }

        if(this.isInstance(id)) {
            let self = this;
            this.getLinksOfInstance(id, function(data) {
                data.forEach(l => {
                    let index = types.map(t => t.id).indexOf(l.linkTypeId);
                    if(index === -1) {
                        let type = self.getLinkTypesById(l.linkTypeId);
                        if (type) types.push({id: type.id, count: 1});
                    }else {
                        types[index].count++;
                    }
                });
                onSuccess(types);
            }, this.instances[id].data);
        }else {
            onSuccess(types);
        }
  }
  // ==========================================================================
  public getLinkTypesOf(request:Messages.ElementLinkTypesRequest,
                        onSuccess: (response: any) => void,
                        onError: (response: any) => void) {

        let response:Messages.ElementLinkTypesResponse = {
            requestId: request.requestId,
            linkTypes: []
        };

        this.getLinkTypesIdOfElement(request.elementId, function(types) {
            response.linkTypes = types;
            onSuccess(response);
        });
  }
  // ==========================================================================
  public getSharedData(onSuccess: (response: any) => void,
                         onError: (response: any) => void) {
        onSuccess([]);
  }
  // ==========================================================================
  public getSharedDSData(onSuccess: (response: any) => void,
                         onError: (response: any) => void) {
        onSuccess([]);
  }
  // ==========================================================================
  // Helpers
  // ====================================================
  public isInstance(id: string) {
      return (this.elementsMap[id].types.indexOf('class') === -1 &&
              this.elementsMap[id].types.indexOf('package') === -1);
  }

  private cutSlash(text: string): string{
    if(text.indexOf('/') === 0) return text.slice(1,text.length);
    else return text;
  }

  private pushClass(map:any, id: string, element:MiddleModelElement) {
      if (!map) map = {};
      if (!map[id]) map[id] = [];
      map[id].push(element);
  }

  public getAllElements(): MiddleModelElement[]{
      let keys = Object.keys(this.elementsMap);
      let allElements = [];
      if(keys.length==0) return allElements;
      for(let i = 0; i < keys.length; i++) {
          allElements.push(this.elementsMap[keys[i]]);
      }
      return allElements;
  }

  // Calculating
  // ====================================================
  private calculateElementsAndTypes(request: Messages.RpcRequest, tree: any) { // to do: refactor this recursion
        let packagesTree = { requestId: request.requestId, rootElements: [] };
        let packageElementsMap: {[typeId: string]: MiddleModelElement[] } = {};
        let elementsMap: {[id: string]: MiddleModelElement } = {};
        let instancesMap: {[typeId: string]: MiddleModelElement[] } = {};

        let root: ClassModel = {
            id: 'classes', count: 0, children: [], label: { values: [ { lang: 'en', text: 'Classes' } ] }
        };
        this.calculateElementsAndTypesRec(packageElementsMap, elementsMap, root, tree);
        packagesTree.rootElements = root.children;

        this.packagesTree = packagesTree;
        this.packageElementsMap = packageElementsMap;
        this.elementsMap = elementsMap;
  };

  private calculateElementsAndTypesRec(packageElementsMap: {[typeId: string]: MiddleModelElement[] },
                                       elementsMap: {[id: string]: MiddleModelElement },
                                       root: ClassModel, oldRoot: any):boolean{
      if(oldRoot instanceof Object) {
          let keys = Object.keys(oldRoot);
          for(let i=0; i<keys.length; i++) {
              let clearKey = this.cutSlash(keys[i]);
              let package_: ClassModel = {
                id: (root.id!=='classes'? root.id + '.' + clearKey: this.namespace + '/' + clearKey),
                count: 0, children: [],
                label: { values: [ { lang: 'en', text: clearKey } ] }
              };
              if(this.calculateElementsAndTypesRec(packageElementsMap, elementsMap, package_, oldRoot[keys[i]])) {
                  let packageAsElement:MiddleModelElement = {
                      id:    package_.id,
                      types: ['package'],
                      label: package_.label,
                      properties: {}
                  };
                  elementsMap[packageAsElement.id] = packageAsElement;
              }else {
                  let newEl:MiddleModelElement  = {
                      id:    (root.id!=='classes'? root.id.substr(this.namespace.length+1, root.id.length) + '.' + clearKey : clearKey),
                      types: ['class'],//[keys[i]],
                      label: { values: [ { lang: 'en', text: clearKey } ] },
                      properties: {}
                  };
                  this.pushClass(packageElementsMap, root.id, newEl);
                  elementsMap[newEl.id] = newEl;
                  package_.id = newEl.id;
                  package_.count = 0;
              }
              root.children.push(package_);
              root.count += (package_.count>0?package_.count:1);
          }
          return true;
      }else {
          root.count++;
          return false;
      }
  };

  // -------------------------------------------------
  private findPackageInTree(id: string): ClassModel{
      if(!id || !this.packagesTree) return null;
      if(id==='root') {
        return { id: 'root',
            count: 0, children: this.packagesTree.rootElements,
            label: { values: [ { lang: 'en', text: 'root' } ] }
        };
      }
      let rootElements = this.packagesTree.rootElements;
      let founded = this.findPackageInTreeRec(rootElements, id);
      if(founded!=null) return founded;

      return null;
  }

  private findPackageInTreeRec(rootElements: ClassModel[], id: string): ClassModel{
      for(let i=0; i<rootElements.length; i++) {
          if(rootElements[i].id===id) {
              return rootElements[i];
          }
      }
      for(let i=0; i<rootElements.length; i++) {
          let founded = this.findPackageInTreeRec(rootElements[i].children, id);
          if(founded!=null) return founded;
      }
      return null;
  }
  // -------------------------------------------------

  private findAllContetnOfNode(id: string):MiddleModelElement[]{
      let node: ClassModel = this.findPackageInTree(id);
      let elements:MiddleModelElement[] = (this.packageElementsMap[id]? this.packageElementsMap[id]: []);
      let packages: ClassModel[] = node.children;
      if(packages && packages.length>0) {
        let elementPacs = packages.filter(fp => (this.elementsMap[fp.id]? true: false)).map(p => this.elementsMap[p.id]);
        elements = elements.concat(elementPacs);
      }
      return elements;
  }
  // -------------------------------------------------

  private getFilterElements(request:Messages.FilterRequest, onSuccess: (response: any) => void) {
      let self = this;
      if(!request || !self.packagesTree) onSuccess({requestId: request.requestId, elements: {} });
      
      let filterKey: string = (request.elementTypeId? request.elementTypeId : (request.refElementId? request.refElementId : 'root'));

      let retElementsList: Models.ElementModel[] = [];
      
      let returnResult = function(links, onSuccess) {
            let responce:Messages.FilterResponse = {
                requestId: request.requestId,
                elements: {}
            };
            links.forEach(l =>{
                let index = l.sourceId!==filterKey? l.sourceId: l.targetId;
                if(!request.text || self.elementsMap[index].label.values.map(e => e.text).join(' ').indexOf(request.text)!=-1) {
                retElementsList.push(self.elementsMap[index]);
                }
            });
            if(retElementsList.length>request.limit) {
                let counter = 0;
                retElementsList.forEach(el => {
                    if(counter>=request.offset && counter-request.offset<request.limit) responce.elements[el.id] = el;
                    counter++;
                });
            }else {
                retElementsList.forEach(el => responce.elements[el.id] = el);
            }
            onSuccess(responce);
      };
      
      if(self.elementsMap[filterKey]) {
        let links = self.getLinksOfElement(filterKey, request.refElementLinkId);
        if(self.isInstance(filterKey)) {
            self.getLinksOfInstance(filterKey,function(instlinks) {
                links = links.concat(instlinks);
                returnResult(links,onSuccess);
            },self.instances[filterKey].data, request.refElementLinkId);
        }else {
            returnResult(links, onSuccess);
        }
      }else {
          onSuccess({requestId: request.requestId, elements: {} });
      }
  };

  private getElementsOfNode(root: ClassModel):MiddleModelElement[]{
      let elements = null;
      if(root && this.packageElementsMap[root.id]) {
          elements = this.packageElementsMap[root.id];
      }else {
          elements = [];
      }
      if(root && root.children) {
          for(let i=0; i<root.children.length; i++) {
              let founded = this.getElementsOfNode(root.children[i]);
              elements = elements.concat(founded);
          }
      }

      return elements;
  };

  // -------------------------------------------------

  private setElementInfo(element: MiddleModelElement, info:ISCaheClass) {
        element.iscacheInfo = info;
        element.properties = {};
        for(let parameter in info.parameters) {
            let parm = info.parameters[parameter];
            element.properties[parm.Name] = [{ type: 'string', value: { lang: 'en', text: (parm.Default? parm.Default: '')  } }];
        }
        for(let property in info.properties) {
            let prop = info.properties[property];
            if(prop.Type && prop.Type.indexOf('%')!=0) element.properties[prop.Name] = 
                [{ type: 'string', value: {  lang: 'en', text: (prop.Type? prop.Type: '')  } }];
        }
  }

  // Fetching
  // ===========================================================================
  public fetchModel(onSuccess: (response: any) => void,
                    onError: (response: any) => void) {
      let self = this;
      this.fetchClassTree({}, function(data:any) {
          if(data) {
                self.mapperObj.init(function() {
                    self.fetchAdditionalData(function(additionalData) {
                        self.fetchLinkTypes(function() {
                            self.fetchLinksInfo(function() {
                                    onSuccess({ success: true });
                            }, function() {
                                onError({ success: false });
                            });
                        }, function() {
                            onError({ success: false });
                        });
                    });
                });
          }
      }, function() {
          onError({ success: false });
      });
  }

  private fetchLinkTypes(onSuccess: (response: any) => void,
                         onError?: (response: any) => void) {
      this.linkTypes = [
          {
            id: 'linkType.generalization',
            label: { values: [ { lang: 'en', text: 'Generalization' } ] },
            count: 0
          },
          {
            id: 'linkType.association',
            label: { values: [ { lang: 'en', text: 'Association' } ] },
            count: 0
          },
          {
            id: 'linkType.contain',
            label: { values: [ { lang: 'en', text: 'Contains' } ] },
            count: 0
          },
          {
            id: 'linkType.instanceOf',
            label: { values: [ { lang: 'en', text: 'Instance of' } ] },
            count: 0
          }
      ];
      onSuccess(this.linkTypes);
  }

  private fetchLinksInfo(onSuccess: (response: any) => void,
                         onError?: (response: any) => void) {
      if(!this.linkTypes || !this.elementsMap) return;
      let elements: MiddleModelElement[] = this.getAllElements();
      let links: Models.LinkModel[] = [];
      let lt: Models.LinkType = null;

      for(let i=0; i<elements.length; i++) {
            if(elements[i] && elements[i].iscacheInfo) {
                if(elements[i].iscacheInfo.Super
                && elements[i].iscacheInfo.Super.indexOf('%')!=0
                && this.elementsMap[elements[i].iscacheInfo.Super]) {
                    links.push({
                        linkTypeId: 'linkType.generalization',
                        sourceId: elements[i].id,
                        targetId: elements[i].iscacheInfo.Super
                    });
                    lt = this.getLinkTypesById('linkType.generalization');
                    lt.count++;
                }

                if(elements[i].iscacheInfo.properties) {
                    for(let property in elements[i].iscacheInfo.properties) {
                        let prop: {Name: string, Type: string} = elements[i].iscacheInfo.properties[property];

                        if(prop.Type && prop.Type.indexOf('%')!=0
                        && this.elementsMap[prop.Type]) {
                            let linkId: string = 'linkType.association.'+elements[i].label.values[0].text+'.'+prop.Name;
                            lt = this.getLinkTypesById(linkId);
                            if(lt == null) {
                                this.linkTypes.push({
                                    id: linkId,
                                    label: { values: [ { lang: 'en', text: elements[i].label.values[0].text+'.'+prop.Name } ] },
                                    count: 1
                                });
                            }else {
                                lt.count++;
                            }
                            links.push({
                                linkTypeId: linkId,
                                sourceId: prop.Type,
                                targetId: elements[i].id
                            });
                        }
                    }
                }
                
                if(this.elementInstancesMap[elements[i].id]) {
                    this.elementInstancesMap[elements[i].id].forEach(inst => {
                        links.push({
                            linkTypeId: 'linkType.instanceOf',
                            sourceId: inst.id,
                            targetId: elements[i].id
                        });
                    });
                }
            } else if(elements[i] && elements[i].types.indexOf('package')!=-1) {
                for(let propIndex in elements[i].properties) {
                  links.push({
                      linkTypeId: 'linkType.contain',
                      sourceId: elements[i].id,
                      targetId: propIndex
                  });
                }

            }
      }
      this.modelLinks = links;
      onSuccess(this.linkTypes);
  }

  private fetchClassTree(request: Messages.RpcRequest,
                         onSuccess: (response: any) => void,
                         onError?: (response: any) => void) {
      let self = this;
      $.ajax({
        type: 'GET',
        url: this.serviceUrl + 'intersystemsapi/GetClassTree?namespace=' + self.namespace,
        headers: self.headers,
        success: function(data:any) {
            self.calculateElementsAndTypes(request, data);
            onSuccess(self.packagesTree);
        },
        error: onError
      });
  };

  private fetchAdditionalData(onSuccess: (response: any) => void) {
        let self = this;
        let MAX_REQUEST_SIZE = 3;
        let allElements = this.getAllElements();
        let returned = 0;
        let requested = 0;
        let triggerCounter = 0;
        let list = '';
        let result = {};

        let onDataObtaining = function(data) {
            returned++;
            if(data && data.classes) {
                for(let key in data.classes) {
                    if(self.elementsMap[key]) {
                        self.setElementInfo(self.elementsMap[key], data.classes[key]);
                    }
                }
            }
            if(returned>=requested) {
                self.enrichPackages();
                onSuccess(result);
            }
        ;}
        
        for(let i=0; i<allElements.length; i++) {
            if(triggerCounter>MAX_REQUEST_SIZE) {
                requested++;
                self.sendAdditionalDataRequest(list,onDataObtaining);
                list = '';
                triggerCounter = 0;
            }
            triggerCounter++;
            list += (list==='' ? '': ',') + allElements[i].id;
            self.fetchInstancesOfClass(allElements[i].id, function(classId, instances) {
                if(instances && instances.length>0) {
                    self.findPackageInTree(classId).count = instances.length;
                    self.elementInstancesMap[classId] = instances;
                    instances.forEach(inst => self.elementsMap[inst.id] = inst);
                }
            });
        }
  }
  
  private fetchInstancesOfClass(classId: string, onSuccess: (classId: string, response: any) => void) {
      let self = this;
        self.sendInstanceRequest(classId, function(data: { children: { ID: string, data?:any }[] }) {
            if(!data) return
            let elements: MiddleModelElement[] = [];
            data.children.forEach(inst => {
                let inst_element:MiddleModelElement = {
                    id: 'instanceof.'+classId+'.'+inst.ID,
                    types: [classId],
                    label:  self.mapperObj.extractTitle(inst,classId, inst.ID),
                    properties: {}
                };
                elements.push(inst_element);
                self.instances[inst_element.id] = inst;
            });
            onSuccess(classId, elements);
        });
  }
  
  private enrichPackages() {
    let elements:MiddleModelElement[] = this.getAllElements();
    elements.forEach(element => {
        if(element.types.indexOf('package')!=-1) {
            let relatedElements = this.findAllContetnOfNode(element.id);
            relatedElements.forEach(re => {
               element.properties[re.id] = [{ type: 'string', value: re.label.values[0] }];
            });
        }
    });
  }

  private sendAdditionalDataRequest(list: string, onSuccess: (response: any) => void) {
        let self = this;

        $.ajax({
          type: 'GET',
          url: this.serviceUrl +
               'intersystemsapi/GetArbitraryView?list=' +
               list + '&level=null&namespace=' + self.namespace,
          headers: self.headers,
          success: onSuccess,
          error: function() { onSuccess({}); }
        });
  }

  private sendInstanceRequest(classId: string, onSuccess: (response: any) => void) {
        let self = this;
        $.ajax({
          type: 'GET',
          url: this.serviceUrl +
               'intersystemsapi/details/GetClassInstances/' +
               classId + '?sortByField=ID&namespace=' + self.namespace,
          headers: self.headers,
          success: onSuccess
        });
  }

  private sendInstanceInfoRequest(instId: string, classId: string, onSuccess: (response: any) => void) {
       let self = this;
        $.ajax({
          type: 'GET',
          url: this.serviceUrl + 'intersystemsapi/details/GetInstance/' +
               instId + '?className=' + classId + '&sortByField=ID&namespace=' + self.namespace,
          headers: self.headers,
          success: onSuccess
        });
  }
}
