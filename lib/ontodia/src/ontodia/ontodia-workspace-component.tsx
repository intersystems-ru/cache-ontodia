import * as React from 'react';

export interface Props {
    isViewOnly?:boolean
}

export class OntodiaWorkspaceComponent extends React.Component<Props, {}> {

    render() {
        const introClasses = "<p>Navigate through class tree and click a class to select it.</p>" +
                "<p>When the class is selected, its instances are shown in Instances panel</p>" +
                "<p>Double-click the class expands it and displays its subclasses.</p>",
            introInstances = "<p>Instances of the selected class are displayed here.</p>" +
                "<p>You can select one or several instances and drag-and-drop them directly on canvas to start your " +
                "diagram.</p>",
            introDiagram = "<h4>Main working area</h4><p><b>Zooming:</b> Ctrl-mousewheel or pinch-zoom on touchpad</p>" +
                "<p><b>Pan:</b> Ctrl-mouse drag or mouse wheel</p><h5>Filtering related instances</h5>" +
                "<p>When you select an element on the diagram the Ontodia shows a funnel icon underneath the " +
                "element. By clicking the funnel icon, you can filter the related elements into the Instances " +
                "panel.</p><p>Then related elements can be drag-and-dropped into the diagram.</p>" +
                "<p>By repeating it you can navigate from one element to another as far as you like and your way " +
                "will be shown on the diagram.</p>",
            introConnections = "<p>Connections panel lists all the connection present in the data source.</p>" +
                "<p>You can define which connections Ontodia should display and which should stay hidden.</p>" +
                "<p>You can also change the way they are shown on the diagram: it’s either with the name above " +
                "them or without it.</p>";

        let leftPanel = (
            <div className="ontodia-left-panel filter-panel"
                 data-position="right"
                 data-step="7"
                 data-intro-id="resize"
                 data-intro="Resize">
                <div className="ontodia-widget filter-item"
                     data-position="right"
                     data-step="1"
                     data-intro-id="tree-view"
                     data-intro={introClasses}>
                    <div className="filter-item__inner">
                        <div className="ontodia-widget-heading filter-item__header">Classes</div>
                        <div className="tree-view filter-item__body"></div>
                    </div>
                    <div className="filter-item__handle"></div>
                </div>
                <div className="ontodia-widget filter-item"
                     data-position="top"
                     data-step="2"
                     data-intro-id="filter-view"
                     data-intro={introInstances}>
                    <div className="filter-item__inner">
                        <div className="ontodia-widget-heading filter-item__header">Instances</div>
                        <div className="filter-view filter-item__body"></div>
                    </div>
                </div>
                <div className="filter-panel__handle">
                    <div className="filter-panel__handle-btn"></div>
                </div>
            </div>
        );

        let rightPanel = (
            <div className="ontodia-right-panel filter-panel">
                <div className="ontodia-widget filter-item"
                     data-position="left"
                     data-step="4"
                     data-intro-id="link-types-toolbox"
                     data-intro={introConnections}>
                    <div className="filter-item__inner">
                        <div className="ontodia-widget-heading filter-item__header">Connections</div>
                        <div className="link-types-toolbox filter-item__body"></div>
                    </div>
                </div>
                <div className="filter-panel__handle">
                    <div className="filter-panel__handle-btn"></div>
                </div>
            </div>
        );

        return (
            <div>
                <div className="ontodia-header"><div id="ontodia-toolbar"></div></div>
                <div className="ontodia-workspace">
                    {!this.props.isViewOnly ? leftPanel : null}
                    <div id="diagrams" className="ontodia-main-panel diagramArea"
                         data-position="left"
                         data-step="3"
                         data-intro-id="diagram-area"
                         data-intro={introDiagram}>
                        <div id="chart" style={{overflow: 'hidden', height: '100%', width: '100%'}}></div>
                    </div>
                    {!this.props.isViewOnly ? rightPanel : null}
                </div>
            </div>
        )
    }
}
