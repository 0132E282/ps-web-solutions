import { Button } from "@core/components/ui/button";
import { Input } from "@core/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@core/components/ui/popover";
import axios from "@core/lib/axios";
import { cn } from "@core/lib/utils";
import { CheckCircle2, Link2, Link2Off, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext, type ControllerRenderProps, type FieldValues } from "react-hook-form";
import { route } from 'ziggy-js';

interface InputSlugProps extends React.InputHTMLAttributes<HTMLInputElement> {
    generateFrom?: string;
    reviewApi?: string;
    baseUrl?: string;
    field?: ControllerRenderProps<FieldValues, string>;
}

const slugify = (str: string, strict = true) => {
    if (!str) return "";
    const slug = str
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/([^0-9a-z-\s])/g, "")
        .replace(/(\s+)/g, "-")
        .replace(/-+/g, "-");

    if (strict) {
        return slug.replace(/^-+|-+$/g, "");
    }
    return slug;
};

const InputSlug = ({ generateFrom = "title", reviewApi = "/api/slug/review", className, onChange, field, ...props }: InputSlugProps) => {
    const { watch, setValue, getValues } = useFormContext();
    const sourceValue = watch(generateFrom);
    const currentValue = watch(props.name as string);

    const [isManual, setIsManual] = useState<boolean>(() => {
        return !!props.value;
    });
    const [reviewResult, setReviewResult] = useState<{ valid?: boolean; message?: string; slug?: string } | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
            setIsOpen(false);
        }, 100);
        setHoverTimeout(timeout);
    };

    useEffect(() => {
        if (!isManual && sourceValue) {
            const slug = slugify(sourceValue);
            setValue(props.name as string, slug, { shouldValidate: true, shouldDirty: true });
        }
    }, [sourceValue, isManual, props.name, setValue]);

    const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsManual(true);
        const value = e.target.value;
        const newSlug = slugify(value, false);

        // Force update the input value through field onChange
        field?.onChange(newSlug);

        // Also update the event target for the prop onChange
        e.target.value = newSlug;
        onChange?.(e);
    };

    const toggleMode = () => {
        if (isManual) {
            setIsManual(false);
            const slug = slugify(getValues(generateFrom));
            setValue(props.name as string, slug, { shouldValidate: true, shouldDirty: true });
        } else {
            setIsManual(true);
        }
    };

    const reviewSlug = async () => {
        const slug = getValues(props.name as string);
        if (!slug) return;

        setReviewResult(null);
        try {
            const response = await axios.post(reviewApi, { slug });
            setReviewResult(response.data);
        } catch (error) {
           console.error("Slug review failed", error);
           setReviewResult(null);
        }
    };

    const [fetchedBaseUrl, setFetchedBaseUrl] = useState<string>("");

    useEffect(() => {
        if (props.baseUrl) return;

        const fetchBaseUrl = async () => {
            try {
                const response = await axios.get(route("admin.site.api.url-frontend"));
                if (response.data?.url) {
                    setFetchedBaseUrl(response.data.url);
                } else if (typeof window !== 'undefined') {
                    setFetchedBaseUrl(window.location.origin);
                }
            } catch (e) {
                console.error("Failed to fetch base URL", e);
                if (typeof window !== 'undefined') {
                    setFetchedBaseUrl(window.location.origin);
                }
            }
        };
        fetchBaseUrl();
    }, [props.baseUrl]);

    const finalBaseUrl = props.baseUrl || fetchedBaseUrl;

    const safeCurrentValue = typeof currentValue === 'object' && currentValue !== null
        ? (currentValue['en'] || Object.values(currentValue)[0] || '')
        : currentValue;

    return (
        <div className="space-y-2">
            <div className="relative flex items-center">
                <Input
                    {...props}
                    {...field}
                    value={safeCurrentValue || ''}
                    onChange={handleManualChange}
                    onBlur={(e) => {
                        props.onBlur?.(e);
                        field?.onBlur();
                        reviewSlug();
                    }}
                    className={cn("pr-10", className)}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground rounded-l-none"
                    onClick={toggleMode}
                    title={isManual ? "Switch to auto-generate" : "Switch to manual input"}
                >
                    {isManual ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                </Button>
            </div>

            <div className="flex flex-col gap-1">
                 <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="shrink-0 mt-0.5">Permalink:</span>
                  <a
                      href={`${finalBaseUrl}/${safeCurrentValue || ''}`}
                      target="_blank"
                      className="font-mono break-all hover:text-primary bg-muted/50 px-1.5 py-0.5 rounded select-all transition-colors"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                  >
                      {finalBaseUrl}/{safeCurrentValue || ''}
                  </a>
                    {/* TODO: issue review slug not show when edit */}
                    {/* {finalBaseUrl ? (
                        <Popover open={isOpen} onOpenChange={setIsOpen}>
                            <PopoverTrigger asChild>
                                <a
                                    href={`${finalBaseUrl}/${safeCurrentValue || ''}`}
                                    target="_blank"
                                    className="font-mono break-all hover:text-primary bg-muted/50 px-1.5 py-0.5 rounded select-all transition-colors"
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {finalBaseUrl}/{safeCurrentValue || ''}
                                </a>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-[400px] h-[400px] p-0 flex flex-col overflow-hidden shadow-xl z-50 pointer-events-auto"
                                side="bottom"
                                align="start"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40 shrink-0">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="text-sm font-medium whitespace-nowrap">Preview:</span>
                                        <a href={`${finalBaseUrl}/${safeCurrentValue || ''}`} target="_blank" className="text-sm text-muted-foreground hover:underline truncate max-w-md block">
                                            {finalBaseUrl}/{safeCurrentValue || ''}
                                        </a>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white relative w-full h-full overflow-hidden">
                                    <iframe
                                        src={`${finalBaseUrl}/${safeCurrentValue || ''}`}
                                        className="w-full h-full border-0 absolute inset-0"
                                        title="Preview"
                                        referrerPolicy="no-referrer"
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    ) : (
                         <span className="font-mono break-all bg-muted/50 px-1.5 py-0.5 rounded select-all">
                             {safeCurrentValue || ''}
                        </span>
                    )} */}
                 </div>

                {reviewResult && (
                    <div className={cn("text-xs flex items-center gap-1", reviewResult.valid ? "text-green-600" : "text-destructive")}>
                        {reviewResult.valid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        <span>{reviewResult.message || (reviewResult.valid ? "Slug is valid" : "Slug is invalid")}</span>
                        {reviewResult.slug && reviewResult.slug !== safeCurrentValue && (
                            <span className="text-muted-foreground ml-1">
                                (Suggested: <span className="font-mono">{reviewResult.slug}</span>)
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InputSlug;
