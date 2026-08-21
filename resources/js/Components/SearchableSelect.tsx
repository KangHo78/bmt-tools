import { Check, ChevronDown, Search } from "lucide-react";
import {
    Children,
    isValidElement,
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";

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
                const label = Children.toArray(child.props.children).join("");
                return [
                    {
                        value: String(child.props.value ?? ""),
                        label,
                        disabled: Boolean(child.props.disabled),
                    },
                ];
            }),
        [children],
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
            const menuHeight = 330;
            const roomBelow = window.innerHeight - rect.bottom;
            const top =
                roomBelow < menuHeight && rect.top > roomBelow
                    ? Math.max(8, rect.top - menuHeight - 6)
                    : rect.bottom + 6;
            setPosition({
                left: rect.left,
                top,
                width: rect.width,
            });
        }
    };

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
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
                onKeyDown={(event) => {
                    if (["ArrowDown", "Enter", " "].includes(event.key)) {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
                className={`control flex w-full items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            >
                <span
                    className={`min-w-0 truncate ${selected?.value === "" ? "text-muted" : ""}`}
                >
                    {selected?.label || "Pilih opsi"}
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
                                    placeholder="Cari pilihan..."
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
                                    Pilihan tidak ditemukan.
                                </p>
                            )}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
