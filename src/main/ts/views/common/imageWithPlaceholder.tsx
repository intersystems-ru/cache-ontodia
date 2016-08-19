import * as React from 'react';

export interface Props extends React.HTMLProps<HTMLImageElement> {
    placeholderSrc: string;
}

export class ImageWithPlaceholder
    extends React.Component<Props, {loadError: boolean}> {

    constructor(props: Props) {
        super(props);
        this.onLoadError = this.onLoadError.bind(this);
        this.state = {loadError: false};
    }

    private onLoadError() {
      this.setState({loadError: true});
    }

    render() {
        const error = this.state.loadError;
        return <img {...this.props} onError={this.onLoadError}
                    src={error ? this.props.placeholderSrc : this.props.src} />;
    }
}

export default ImageWithPlaceholder;
