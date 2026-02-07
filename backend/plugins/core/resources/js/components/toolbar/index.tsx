import HeaderToolbarTable from "./toolbar-table-page";
import ToolbarFormPage from "./toolbar-form-page";
// import HeaderToolbarTree from "./HeaderToolbarTree";
import ToolbarDataTableRow from "./toolbar-table-row";

interface ToolbarProps {
    form?: 'table' | 'form' | 'tree' | 'row';
    props?: Record<string, unknown>;
}

const Toolbar = ({ form = 'table', ...props }: ToolbarProps) => {
    switch (form) {
        case 'table':
            return <HeaderToolbarTable {...props.props} />;
        case 'form':
            return <ToolbarFormPage {...props.props} />;
        case 'tree':
            return null;
        case 'row':
            return <ToolbarDataTableRow row={props.props?.row as Record<string, unknown> & { id?: number | string }} />;
        default:
            return null;
    }
};

export default Toolbar;
export { FileToolbar } from "./toolbar-file-page";
export { FileSelectionActions } from "./FileSelectionActions";