export default class FontWeight extends Plugin {
    static get pluginName(): string;
    constructor(editor: any);
    init(): void;
    options: ({
        title: string;
        value: null;
    } | {
        title: string;
        value: string;
    })[];
}
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
