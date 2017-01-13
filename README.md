# Ontodia-cache class viewer

An Ontodia Class explorer for InterSystems Caché.


## Site ontodia

http://www.ontodia.org


## Installation

To install latest Ontodia-cache class viewer, you just need to import OntodiaCache package. Download the
archive from (https://github.com/intersystems-ru/cache-ontodia/releases), then import
<code>Ontodia Cache.xml</code> file in csp from package. As a result you'll
get all necessary resources, and as compilations results you obtain new web-application for REST-api.

## Usage

When installation is completed, you can go to {server url}/csp/ontodia-cache/index.html to view classes of specified namespace.
URL parameters:
namespace: string - specified namespace. (By default = 'Samples').

Example:
http://localhost:57772/csp/ontodia-cache/index.html?namespace=Samples

## Building a new version of Ontodia Cache.xml

To build the project, you need [NodeJS](https://nodejs.org) platform to be installed. Then, clone source
code and run <code>npm install</code> from the root directory of the project. This will install all necessary
modules from NPM for the project.

On the next step you need to install the old Ontodia Cache.xml. To do that refer to Installation Section.

From now on you will only need to run <code>npm run webpack</code> command from the project root.
This will generate source code, which can be moved to  Intersystems Cache' Studio ({Server folder}\Cache\CSP\{namespace}
Example: C:\InterSystems\Cache\CSP\ontodia-cache) to create a new version of application.

Now in Intersystems Cache' Studio right click the root element in Workspace panel and select "export to xml" option and choose a folder to place the .xml file.
