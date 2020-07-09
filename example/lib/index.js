import { html } from 'htm/preact';
import { render } from 'preact';

const app = () => html`<h1>Hello world</h1>`;

render(app(), document.body);
