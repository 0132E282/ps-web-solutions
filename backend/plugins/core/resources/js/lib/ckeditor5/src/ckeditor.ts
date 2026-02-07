import { Alignment } from '@ckeditor/ckeditor5-alignment';
import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Autosave } from '@ckeditor/ckeditor5-autosave';
import {
    Bold,
    Code,
    Italic,
    Strikethrough,
    Subscript,
    Superscript,
    Underline,
} from '@ckeditor/ckeditor5-basic-styles';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { CodeBlock } from '@ckeditor/ckeditor5-code-block';
import type { EditorConfig } from '@ckeditor/ckeditor5-core';
import { ClassicEditor } from '@ckeditor/ckeditor5-editor-classic';
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { FindAndReplace } from '@ckeditor/ckeditor5-find-and-replace';
import { FontBackgroundColor, FontColor, FontFamily, FontSize } from '@ckeditor/ckeditor5-font';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { Highlight } from '@ckeditor/ckeditor5-highlight';
import { HorizontalLine } from '@ckeditor/ckeditor5-horizontal-line';
import { HtmlEmbed } from '@ckeditor/ckeditor5-html-embed';
import {
    DataFilter,
    DataSchema,
    FullPage,
    GeneralHtmlSupport,
    HtmlComment,
} from '@ckeditor/ckeditor5-html-support';
import {
    AutoImage,
    Image,
    ImageCaption,
    ImageInsert,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
} from '@ckeditor/ckeditor5-image';
import { Indent, IndentBlock } from '@ckeditor/ckeditor5-indent';
import { TextPartLanguage } from '@ckeditor/ckeditor5-language';
import { AutoLink, Link, LinkImage } from '@ckeditor/ckeditor5-link';
import { List, ListProperties, TodoList } from '@ckeditor/ckeditor5-list';
import { Markdown } from '@ckeditor/ckeditor5-markdown-gfm';
import { MediaEmbed, MediaEmbedToolbar } from '@ckeditor/ckeditor5-media-embed';
import { PageBreak } from '@ckeditor/ckeditor5-page-break';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office';
import { RemoveFormat } from '@ckeditor/ckeditor5-remove-format';
import { StandardEditingMode } from '@ckeditor/ckeditor5-restricted-editing';
import { SelectAll } from '@ckeditor/ckeditor5-select-all';
import { ShowBlocks } from '@ckeditor/ckeditor5-show-blocks';
import { SourceEditing } from '@ckeditor/ckeditor5-source-editing';
import {
    SpecialCharacters,
    SpecialCharactersArrows,
    SpecialCharactersCurrency,
    SpecialCharactersEssentials,
    SpecialCharactersLatin,
    SpecialCharactersMathematical,
    SpecialCharactersText,
} from '@ckeditor/ckeditor5-special-characters';
import { Style } from '@ckeditor/ckeditor5-style';
import {
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
} from '@ckeditor/ckeditor5-table';
import { TextTransformation } from '@ckeditor/ckeditor5-typing';
import { Undo } from '@ckeditor/ckeditor5-undo';
import { SimpleUploadAdapter } from '@ckeditor/ckeditor5-upload';
import { EditorWatchdog } from '@ckeditor/ckeditor5-watchdog';
import { WordCount } from '@ckeditor/ckeditor5-word-count';
import FileManager from './plugins/FileManager';
import FontWeight from './plugins/FontWeight';

// You can read more about extending the build with additional plugins in the "Installing plugins" guide.
// See https://ckeditor.com/docs/ckeditor5/latest/installation/plugins/installing-plugins.html for details.
class Editor extends ClassicEditor {
    public static override builtinPlugins = [
        Alignment,
        AutoImage,
        AutoLink,
        Autoformat,
        Autosave,
        BlockQuote,
        Bold,
        Code,
        CodeBlock,
        DataFilter,
        DataSchema,
        Essentials,
        FindAndReplace,
        FontBackgroundColor,
        FontColor,
        FontFamily,
        FontSize,
        FullPage,
        GeneralHtmlSupport,
        Heading,
        Highlight,
        HorizontalLine,
        HtmlComment,
        HtmlEmbed,
        Image,
        ImageCaption,
        ImageInsert,
        ImageResize,
        ImageStyle,
        ImageToolbar,
        ImageUpload,
        Indent,
        IndentBlock,
        Italic,
        Link,
        LinkImage,
        List,
        ListProperties,
        Markdown,
        MediaEmbed,
        MediaEmbedToolbar,
        PageBreak,
        Paragraph,
        PasteFromOffice,
        RemoveFormat,
        SelectAll,
        ShowBlocks,
        SimpleUploadAdapter,
        SourceEditing,
        SpecialCharacters,
        SpecialCharactersArrows,
        SpecialCharactersCurrency,
        SpecialCharactersEssentials,
        SpecialCharactersLatin,
        SpecialCharactersMathematical,
        SpecialCharactersText,
        StandardEditingMode,
        Strikethrough,
        Style,
        Subscript,
        Superscript,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableProperties,
        TableToolbar,
        TextPartLanguage,
        TextTransformation,
        TodoList,
        Underline,
        Undo,
        WordCount,
        FileManager,
        FontWeight,
    ];

    public static override defaultConfig: EditorConfig = {
        licenseKey: 'GPL',
        toolbar: {
            items: [
                'fileManager', // Temporarily disabled due to icon issue
                '|',
                'heading',
                '|',
                'bold',
                'italic',
                'underline',
                '|',
                'alignment',
                '|',
                'bulletedList',
                'numberedList',
                'mediaEmbed',
                'sourceEditing',
                '|',
                'fontFamily',
                'fontSize',
                'fontColor',
                'fontBackgroundColor',
                'fontWeight',
            ],
        },
        simpleUpload: {
            uploadUrl: '/files',
        },
        menuBar: {
            isVisible: true,
        },
        language: 'en',
        image: {
            toolbar: [
                'imageStyle:full',
                'imageStyle:side',
                '|',
                'imageTextAlternative',
                'toggleImageCaption',
                '|',
                'linkImage',
            ],
        },
        table: {
            contentToolbar: [
                'tableColumn',
                'tableRow',
                'mergeTableCells',
                'tableCellProperties',
                'tableProperties',
            ],
        },
        mediaEmbed: {
            previewsInData: true,
        },
        heading: {
            options: [
                { model: 'paragraph', title: 'Paragraph', class: '' },
                { model: 'heading1', view: 'h1', title: 'Heading 1', class: '' },
                { model: 'heading2', view: 'h2', title: 'Heading 2', class: '' },
                { model: 'heading3', view: 'h3', title: 'Heading 3', class: '' },
                { model: 'heading4', view: 'h4', title: 'Heading 4', class: '' },
                { model: 'heading5', view: 'h5', title: 'Heading 5', class: '' },
                { model: 'heading6', view: 'h6', title: 'Heading 6', class: '' },
            ],
        },
        fontSize: {
            options: [
                9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 40, 44, 48, 54, 60, 66, 72, 80, 88, 96
            ],
            supportAllValues: true,
        },
        removePlugins: ['MediaEmbedToolbar'],
        extraPlugins: [FileManager],

        htmlSupport: {
            allow: [
                {
                    name: 'div',
                    styles: true,
                    attributes: true,
                },
                {
                    name: /.+/,
                    styles: true,
                    attributes: true,
                },
            ],
        },
        // FileManager custom configuration - using type assertion to bypass TypeScript check
        fileManager: {
            // multiple: true, // Allow multiple file selection
            // acceptTypes: ['file'], // Accept only files or ['file', 'folder']
            // allowedFileTypes: ['image/*', '.pdf'], // Filter by mime types or extensions
            // maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
            // label: 'File Manager', // Custom button label
            // icon: '<svg>...</svg>', // Custom button icon
            // customInsert: (editor, writer, item, position) => {
            //     // Custom insert handler
            //     const url = item.absolute_url || item.path;
            //     const element = writer.createElement('paragraph', {}, [
            //         writer.createText(item.name, { linkHref: url })
            //     ]);
            //     writer.insert(element, position);
            // },
        } as any,
    } as EditorConfig;
}

export default { Editor, EditorWatchdog };
