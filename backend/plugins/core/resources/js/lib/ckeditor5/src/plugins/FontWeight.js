import Command from '@ckeditor/ckeditor5-core/src/command';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import { addToolbarToDropdown, createDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';
import UIModel from '@ckeditor/ckeditor5-ui/src/model';
const Model = UIModel;

// Bold icon SVG - using full SVG string as CKEditor5 expects
const fontWeightIcon = '<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.187 17H5.773q-.956 0-1.364-.415-.41-.416-.409-1.323V4.738q0-.926.419-1.332.418-.405 1.354-.406h4.68q1.035 0 1.793.124.76.124 1.36.478.512.296.906.75a3.26 3.26 0 0 1 .808 2.162q0 2.102-2.167 3.075 2.846.879 2.847 3.421a3.76 3.76 0 0 1-2.296 3.504 6 6 0 0 1-1.517.377q-.857.11-2 .11zm-.217-6.217H7v4.087h3.069q2.965 0 2.965-2.072 0-1.061-.768-1.537-.768-.478-2.296-.478M7 5.13v3.619h2.606q1.093 0 1.69-.2a1.6 1.6 0 0 0 .91-.765q.247-.4.247-.897 0-1.06-.778-1.409-.778-.348-2.375-.348z"/></svg>';

export default class FontWeight extends Plugin {
    static get pluginName() {
        return 'FontWeight';
    }

    init() {
        const editor = this.editor;
        const t = editor.t;

        // Register the command.
        editor.commands.add('fontWeight', new FontWeightCommand(editor));

        // Register the dropdown
        editor.ui.componentFactory.add('fontWeight', (locale) => {
            const dropdownView = createDropdown(locale);
            const command = editor.commands.get('fontWeight');
            const items = new Map();

            this.options.forEach((option) => {
                const buttonModel = new Model({
                    commandValue: option.value,
                    label: option.title,
                    withText: true,
                });

                buttonModel.bind('isOn').to(command, 'value', (value) => value === option.value);
                buttonModel.bind('isEnabled').to(command);

                const button = new ButtonView(locale);
                button.bind(...Object.keys(buttonModel)).to(buttonModel);

                button.on('execute', () => {
                    editor.execute('fontWeight', { value: option.value });
                    editor.editing.view.focus();
                });

                items.set(option.title, button);
            });

            addToolbarToDropdown(dropdownView, Array.from(items.values()));

            dropdownView.buttonView.set({
                label: t('Font Weight'),
                icon: fontWeightIcon,
                tooltip: true,
                withText: false,
            });

            return dropdownView;
        });
    }

    constructor(editor) {
        super(editor);
        this.options = [
            { title: 'Default', value: null },
            { title: 'Thin', value: '100' },
            { title: 'Extra Light', value: '200' },
            { title: 'Light', value: '300' },
            { title: 'Normal', value: '400' },
            { title: 'Medium', value: '500' },
            { title: 'Semi Bold', value: '600' },
            { title: 'Bold', value: '700' },
            { title: 'Extra Bold', value: '800' },
            { title: 'Black', value: '900' },
        ];
    }
}

class FontWeightCommand extends Command {
    execute(options) {
        const editor = this.editor;
        const model = editor.model;
        const katexElement = model.document.selection.getSelectedElement();
        const selection = model.document.selection;

        model.change((writer) => {
            // Get the ranges in the selection.
            // const ranges = model.schema.getValidRanges(selection.getRanges(), 'fontWeight');

            // for (const range of ranges) {
            if (options.value) {
                writer.setAttribute('fontWeight', options.value, katexElement);
            } else {
                writer.removeAttribute('fontWeight', katexElement);
            }
            // }
        });
    }

    refresh() {
        const model = this.editor.model;
        const document = model.document;
        const selection = document.selection;

        this.isEnabled = model.schema.checkAttributeInSelection(selection, 'fontWeight');
        this.value = selection.getAttribute('fontWeight');
    }
}
