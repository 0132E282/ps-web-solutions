import { Button } from '@core/components/ui/button';
import { Save } from 'lucide-react';
import { tt } from '@core/lib/i18n';
import type { FormActionsProps } from '@core/types/forms';

export default function FormActions({ isEdit = false }: FormActionsProps) {
    return (
        <div className="fixed bottom-0 right-0 left-0 lg:left-64 bg-background border-t p-4 z-10">
            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                >
                    {tt('common.cancel')}
                </Button>
                <Button type="submit" className="gap-2">
                    <Save className="h-4 w-4" />
                    {isEdit ? tt('common.save_changes') : tt('common.create')}
                </Button>
            </div>
        </div>
    );
}
