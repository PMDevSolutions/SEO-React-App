import { CopyMinus } from 'lucide-react';
import React, {Component} from 'react';
import ReactDOM from 'react-dom';

class App extends Component {
    render() {
        return (
            <div>This is a React component inside of Webflow!</div>
        )
    }
}

ReactDOM(
    React.createElement(App, {}, null),
    document.getElementById('react-target')
);