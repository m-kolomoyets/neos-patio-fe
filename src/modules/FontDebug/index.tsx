import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FONT_WEIGHT_TOKEN_PREFIX, SPECIMEN_TEXT, WEIGHT_MAX, WEIGHT_MIN, WEIGHT_STEP } from './constants';
import {
    buildCssBlock,
    isWindows,
    loadStoredState,
    readTokenValue,
    saveStoredState,
    scanFontWeightTokenNames,
} from './utils';
import s from './styles.module.css';

const clampWeight = (raw: string): string => {
    const parsed = Number.parseInt(raw, 10);

    if (Number.isNaN(parsed)) {
        return '';
    }

    return String(Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, parsed)));
};

/** Stylesheet values, read before any override is applied, so they survive a per-token reset. */
const getDefaults = (names: string[]): Record<string, string> => {
    return Object.fromEntries(
        names.map((name) => {
            return [name, readTokenValue(name)];
        })
    );
};

/**
 * Temporary font-weight tuning panel, mounted only when `?font-debug` is present.
 * Its own chrome deliberately avoids the `--fw-*` tokens so it stays a stable
 * reference while the tokens it edits are being dragged around.
 */
export const FontDebugPanel: React.FC = () => {
    const [names] = useState(scanFontWeightTokenNames);
    const [defaults] = useState(() => {
        return getDefaults(names);
    });
    const [values, setValues] = useState<Record<string, string>>(() => {
        const stored = loadStoredState();

        return Object.fromEntries(
            names.map((name) => {
                return [name, stored?.values[name] ?? defaults[name]];
            })
        );
    });
    const [collapsed, setCollapsed] = useState(() => {
        return loadStoredState()?.collapsed ?? false;
    });
    const [copied, setCopied] = useState(false);

    useEffect(
        function applyOverrides() {
            const { style } = document.documentElement;

            for (const name of names) {
                const value = values[name];

                if (value) {
                    style.setProperty(name, value);
                } else {
                    style.removeProperty(name);
                }
            }
        },
        [names, values]
    );

    useEffect(
        function clearOverridesOnUnmount() {
            return () => {
                const { style } = document.documentElement;

                for (const name of names) {
                    style.removeProperty(name);
                }
            };
        },
        [names]
    );

    useEffect(
        function persistState() {
            saveStoredState({ collapsed, values });
        },
        [collapsed, values]
    );

    useEffect(
        function resetCopiedLabel() {
            if (!copied) {
                return;
            }

            const timeout = setTimeout(() => {
                setCopied(false);
            }, 1500);

            return () => {
                clearTimeout(timeout);
            };
        },
        [copied]
    );

    const handleChange = (name: string, value: string) => {
        setValues((current) => {
            return { ...current, [name]: value };
        });
    };

    const handleBlur = (name: string) => {
        setValues((current) => {
            return { ...current, [name]: clampWeight(current[name]) };
        });
    };

    const handleCopy = () => {
        const css = buildCssBlock(names, (name) => {
            return values[name] || defaults[name];
        });

        navigator.clipboard.writeText(css).then(
            () => {
                setCopied(true);
            },
            () => {
                setCopied(false);
            }
        );
    };

    const handleReset = () => {
        setValues(
            Object.fromEntries(
                names.map((name) => {
                    return [name, ''];
                })
            )
        );
    };

    return createPortal(
        <section className={s.root} aria-label="Font weight debug">
            <header className={s.header}>
                <div className={s.heading}>
                    <span className={s.title}>Font weights</span>
                    <span className={s.badge}>{isWindows() ? 'Windows' : 'Non-Windows'}</span>
                </div>
                <button
                    className={s['icon-button']}
                    type="button"
                    aria-expanded={!collapsed}
                    onClick={() => {
                        setCollapsed((current) => {
                            return !current;
                        });
                    }}
                >
                    {collapsed ? 'Show' : 'Hide'}
                </button>
            </header>

            {!collapsed && (
                <>
                    <ul className={s.list}>
                        {names.map((name) => {
                            const inputId = `font-debug-${name.replace(FONT_WEIGHT_TOKEN_PREFIX, '')}`;
                            const value = values[name];

                            return (
                                <li className={s.row} key={name}>
                                    <div className={s.controls}>
                                        <label className={s.label} htmlFor={inputId}>
                                            {name}
                                        </label>
                                        <input
                                            className={s.range}
                                            type="range"
                                            min={WEIGHT_MIN}
                                            max={WEIGHT_MAX}
                                            step={WEIGHT_STEP}
                                            value={value || defaults[name]}
                                            aria-label={`${name} slider`}
                                            onChange={(event) => {
                                                handleChange(name, event.target.value);
                                            }}
                                        />
                                        <input
                                            className={s.number}
                                            id={inputId}
                                            type="number"
                                            min={WEIGHT_MIN}
                                            max={WEIGHT_MAX}
                                            step={WEIGHT_STEP}
                                            value={value}
                                            onChange={(event) => {
                                                handleChange(name, event.target.value);
                                            }}
                                            onBlur={() => {
                                                handleBlur(name);
                                            }}
                                        />
                                    </div>
                                    <p className={s.specimen} style={{ fontWeight: `var(${name})` }}>
                                        {SPECIMEN_TEXT}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>

                    <footer className={s.footer}>
                        <button className={s.button} type="button" onClick={handleReset}>
                            Reset
                        </button>
                        <button className={s.button} type="button" onClick={handleCopy}>
                            {copied ? 'Copied' : 'Copy CSS'}
                        </button>
                    </footer>
                </>
            )}
        </section>,
        document.body
    );
};
