import { Check, ChevronDown, Search } from "lucide-react";
import {
    Children,
    isValidElement,
    type ReactNode,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/lib/i18n";

type SelectEvent = { target: { value: string } };

interface SearchableSelectProps {
    children: ReactNode;
    value?: string | number | null;
    onChange?: (event: SelectEvent) => void;
    className?: string;
    disabled?: boolean;
    name?: string;
    "aria-label"?: string;
}

type SelectOption = {
    value: string;
    label: string;
    disabled: boolean;
};

export default function SearchableSelect({
    children,
    value,
    onChange,
    className = "",
    disabled = false,
    name,
    "aria-label": ariaLabel,
}: SearchableSelectProps) {
    const { t } = useLocale();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const [position, setPosition] = useState({ left: 0, top: 0, width: 0 });

    const options = useMemo<SelectOption[]>(
        () =>
            Children.toArray(children).flatMap((child) => {
                if (
                    !isValidElement<{
                        value?: string | number;
                        disabled?: boolean;
                        children?: ReactNode;
                    }>(child)
                )
                    return [];
                const label = t(
                    Children.toArray(child.props.children).join(""),
                );
                return [
                    {
                        value: String(child.props.value ?? ""),
                        label,
                        disabled: Boolean(child.props.disabled),
                    },
                ];
            }),
        [children, t],
    );
    const selected = options.find(
        (option) => option.value === String(value ?? ""),
    );
    const filtered = options.filter((option) =>
        option.label
            .toLocaleLowerCase("id")
            .includes(query.toLocaleLowerCase("id")),
    );

    const placeMenu = () => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
            const gap = 6;
            const screenPadding = 8;
            const estimatedMenuHeight =
                62 + Math.min(256, Math.max(50, filtered.length * 44 + 12));
            const menuHeight =
                menuRef.current?.getBoundingClientRect().height ||
                estimatedMenuHeight;
            const roomBelow = window.innerHeight - rect.bottom - screenPadding;
            const roomAbove = rect.top - screenPadding;
            const openAbove = roomBelow < menuHeight && roomAbove > roomBelow;
            const top = openAbove
                ? Math.max(screenPadding, rect.top - menuHeight - gap)
                : Math.min(
                      rect.bottom + gap,
                      window.innerHeight - menuHeight - screenPadding,
                  );
            setPosition({
                left: Math.max(
                    screenPadding,
                    Math.min(
                        rect.left,
                        window.innerWidth - rect.width - screenPadding,
                    ),
                ),
                top,
                width: rect.width,
            });
        }
    };

    const openMenu = () => {
        placeMenu();
        setOpen(true);
    };

    useLayoutEffect(() => {
        if (open) placeMenu();
    }, [open, query, filtered.length]);

    useEffect(() => {
        if (!open) return;
        placeMenu();
        setQuery("");
        setActiveIndex(0);
        requestAnimationFrame(() => searchRef.current?.focus());
        const close = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                !buttonRef.current?.contains(target) &&
                !menuRef.current?.contains(target)
            )
                setOpen(false);
        };
        const reposition = () => placeMenu();
        document.addEventListener("mousedown", close);
        window.addEventListener("resize", reposition);
        window.addEventListener("scroll", reposition, true);
        return () => {
            document.removeEventListener("mousedown", close);
            window.removeEventListener("resize", reposition);
            window.removeEventListener("scroll", reposition, true);
        };
    }, [open]);

    const choose = (option: SelectOption) => {
        if (option.disabled) return;
        onChange?.({ target: { value: option.value } });
        setOpen(false);
        buttonRef.current?.focus();
    };

    return (
        <div className="relative min-w-0">
            {name && (
                <input type="hidden" name={name} value={String(value ?? "")} />
            )}
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                aria-label={ariaLabel ? t(ariaLabel) : undefined}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => (open ? setOpen(false) : openMenu())}
                onKeyDown={(event) => {
                    if (["ArrowDown", "Enter", " "].includes(event.key)) {
                        event.preventDefault();
                        openMenu();
                    }
                }}
                className={`control flex w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            >
                <span
                    className={`min-w-0 truncate ${selected?.value === "" ? "text-muted" : ""}`}
                >
                    {selected?.label || t("Pilih opsi")}
                </span>
                <ChevronDown
                    size={16}
                    className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
                />
            </button>
            {open &&
                typeof document !== "undefined" &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-[200] overflow-hidden rounded-md border border-line bg-surface shadow-[0_18px_50px_rgba(22,29,26,.22)]"
                        style={{
                            left: position.left,
                            top: position.top,
                            width: position.width,
                        }}
                    >
                        <div className="border-b border-line p-2">
                            <div className="flex items-center gap-2 rounded border border-line bg-canvas px-3 focus-within:border-green">
                                <Search
                                    size={15}
                                    className="shrink-0 text-muted"
                                />
                                <input
                                    ref={searchRef}
                                    value={query}
                                    onChange={(event) => {
                                        setQuery(event.target.value);
                                        setActiveIndex(0);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "Escape")
                                            setOpen(false);
                                        if (event.key === "ArrowDown") {
                                            event.preventDefault();
                                            setActiveIndex((index) =>
                                                Math.min(
                                                    index + 1,
                                                    filtered.length - 1,
                                                ),
                                            );
                                        }
                                        if (event.key === "ArrowUp") {
                                            event.preventDefault();
                                            setActiveIndex((index) =>
                                                Math.max(index - 1, 0),
                                            );
                                        }
                                        if (
                                            event.key === "Enter" &&
                                            filtered[activeIndex]
                                        ) {
                                            event.preventDefault();
                                            choose(filtered[activeIndex]);
                                        }
                                    }}
                                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                                    placeholder={t("Cari pilihan...")}
                                />
                            </div>
                        </div>
                        <div
                            role="listbox"
                            className="max-h-64 overflow-y-auto p-1.5"
                        >
                            {filtered.length ? (
                                filtered.map((option, index) => (
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={
                                            option.value === String(value ?? "")
                                        }
                                        disabled={option.disabled}
                                        key={`${option.value}-${index}`}
                                        onMouseEnter={() =>
                                            setActiveIndex(index)
                                        }
                                        onClick={() => choose(option)}
                                        className={`flex w-full items-center justify-between gap-3 rounded px-3 py-2.5 text-left text-sm transition disabled:opacity-40 ${index === activeIndex ? "bg-ink text-white" : "hover:bg-canvas"}`}
                                    >
                                        <span className="min-w-0 truncate">
                                            {option.label}
                                        </span>
                                        {option.value ===
                                            String(value ?? "") && (
                                            <Check
                                                size={15}
                                                className="shrink-0"
                                            />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="px-3 py-6 text-center text-sm text-muted">
                                    {t("Pilihan tidak ditemukan.")}
                                </p>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
