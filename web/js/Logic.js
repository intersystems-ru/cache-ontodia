var Logic = function (parent) {

    this.cacheUMLExplorer = parent;

};

/**
 * Modify data, add relations, connections, helpers.
 *
 * @param {{basePackageName: string, classes: object<string,*>, restrictPackage: number}} data
 */
Logic.prototype.process = function (data) {

    var self = this,
        cls, clsName;

    console.log("before", JSON.parse(JSON.stringify(data)));

    this.data = data;

    data.classes["%Persistent"] = data.classes["%Library.Persistent"] = {
        $classType: "Persistent"
    };
    data.classes["%SerialObject"] = data.classes["%Library.SerialObject"] = {
        $classType: "Serial"
    };
    data.classes["%Library.RegisteredObject"] = data.classes["%RegisteredObject"] = {
        $classType: "Registered"
    };
    data.classes["%Library.DataType"] = data.classes["%DataType"] = {
        $classType: "DataType"
    };

    if (!this.data.inheritance) this.data.inheritance = {};
    for (clsName in data.classes) {
        cls = data.classes[clsName];
        if (cls.super) cls.super.split(",").forEach(function (name) { self.inherits(clsName, name); });
    }

    this.alignClassTypes(); // call after inheritance scheme done

    if (!this.cacheUMLExplorer.settings.showDataTypesOnDiagram) {
        for (clsName in data.classes) {
            if (/%Library\..*/.test(clsName)) delete data.classes[clsName];
        }
    }

    this.fillAssociations();

    delete data.classes["%Persistent"];
    delete data.classes["%Library.Persistent"];
    delete data.classes["%SerialObject"];
    delete data.classes["%Library.SerialObject"];
    delete data.classes["%Library.RegisteredObject"];
    delete data.classes["%RegisteredObject"];
    delete data.classes["%Library.DataType"];
    delete data.classes["%DataType"];

    console.log("after", JSON.parse(JSON.stringify(data)));

};

Logic.prototype.fillAssociations = function () {

    var self = this,
        className, properties, propertyName, po, assoc, compos, aggr;

    if (!(assoc = this.data.association)) assoc = this.data.association = {};
    if (!(compos = this.data.composition)) compos = this.data.composition = {};
    if (!(aggr = this.data.aggregation)) aggr = this.data.aggregation = {};

    for (className in this.data.classes) {
        properties = this.data.classes[className]["properties"];
        if (!properties) continue;
        for (propertyName in properties) {
            po = properties[propertyName];
            if (po["cardinality"] === "one") {
                if (!aggr[po.type]) aggr[po.type] = {};
                aggr[po.type][className] = {
                    left: "*",
                    right: "1"
                };
            } else if (po["cardinality"] === "parent") {
                if (!compos[po.type]) compos[po.type] = {};
                compos[po.type][className] = {
                    left: "*",
                    right: "1"
                };
            } else if (self.data.classes[po.type] && !po["cardinality"]) {
                if (!assoc[po.type]) assoc[po.type] = {};
                assoc[po.type][className] = {};
            }
        }
    }

};

/**
 * @private
 * @param {string} className
 * @param {string} inhName
 */
Logic.prototype.inherits = function (className, inhName) {

    if (!this.data.inheritance[className]) this.data.inheritance[className] = {};
    if (!this.data.inheritance[className][inhName]) {
        this.data.inheritance[className][inhName] = 1;
    } else {
        return;
    }

    if (!this.data.classes[inhName]) {
        this.data.classes[inhName] = {};
    }

};

/**
 * @private
 * @param {string} className
 * @returns {string[]} - derived class names
 */
Logic.prototype.getDerivedClasses = function (className) {

    var arr = [];

    for (var a in this.data.inheritance) {
        if (this.data.inheritance[a][className]) arr.push(a);
    }

    return arr;

};

Logic.prototype.getNonInheritingClasses = function () {

    var arr = [];

    for (var className in this.data.classes) {
        if (!this.data.inheritance[className]) arr.push(className);
    }

    return arr;

};

/**
 * Correcting Cache's class keyword "ClassType".
 * @param classType
 * @returns {*}
 */
Logic.prototype.getNormalClassType = function (classType) {

    if (classType === "datatype") return "DataType";
    else if (classType === "serial") return "Serial";
    else if (classType === "persistent") return "Persistent";
    else return lib.capitalize(classType); // (Registered), Stream, View, Index

};

/**
 * Fills $classType
 * @private
 */
Logic.prototype.alignClassTypes = function () {

    var self = this;

    var extendDerivedClasses = function (className, classObj, root) {
        (root ? self.getNonInheritingClasses() : self.getDerivedClasses(className)).forEach(
            function (derivedClassName) {
            var derivedObj = self.data.classes[derivedClassName];
            if (!derivedObj.$classType) { // not assigned yet
                // try to get class type from parent
                if (classObj.$classType) derivedObj.$classType = classObj.$classType;
                // reassign class type from classType property
                if (derivedObj.classType)
                    derivedObj.$classType = self.getNormalClassType(derivedObj.classType);
            }
            extendDerivedClasses(derivedClassName, derivedObj);
        });
    };

    extendDerivedClasses("", {}, true);

};