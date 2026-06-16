import type { NamingStepProps } from './types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Typography } from '@/components/ui/Typography';
import s from './styles.module.css';

/** Naming step form: confirm the asset name and save it with a single action. */
export const NamingStep: React.FC<NamingStepProps> = ({ name, onChangeName, onSave }) => {
    return (
        <form
            className={s.form}
            onSubmit={(event) => {
                event.preventDefault();
                onSave();
            }}
        >
            <div className={s.field}>
                <Typography variant="text-xs" className={s.caption} render={<ol start={2} />}>
                    <li>Check the asset name</li>
                </Typography>
                <Input
                    className={s.input}
                    type="search"
                    value={name}
                    placeholder="Name your asset"
                    autoFocus
                    onChange={(event) => {
                        onChangeName(event.target.value);
                    }}
                />
            </div>
            <Button type="submit" variant="brand" size="md" disabled={!name.trim()}>
                Save Asset
            </Button>
        </form>
    );
};
