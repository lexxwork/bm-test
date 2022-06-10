import { useState, useEffect } from 'react';
import styles from './index.module.scss';
import { Select, IOption } from 'components/Select';

export interface IFilterQuery {
  // [key: string]: string | number | null | undefined;
  query?: string;
  filter?: string;
}

interface IFilterProps {
  options: IOption[];
  validateFn?: (value: string, filter: string) => boolean;
  onSearch: (options: IFilterQuery) => void;
}

export const SearchFilter: React.FC<IFilterProps> = ({ options, onSearch, validateFn }) => {
  const defaultOption: IOption = options[0] || {
    value: null,
    title: '',
  };
  const [filterSelected, setSelectedFilter] = useState<IOption>(defaultOption);
  const [queryValue, setQueryValue] = useState('');
  const [validState, setValidState] = useState(false);

  const doSearch = () => {
    if (!validState) return;
    onSearch({ query: queryValue.trim(), filter: filterSelected.value });
  };

  useEffect(() => {
    const validate = () => {
      const defaultCheck: boolean = !!queryValue.trim() && !!filterSelected.value;
      const customCheck: boolean = !!validateFn
        ? validateFn(queryValue, filterSelected.value)
        : true;
      setValidState(defaultCheck && customCheck);
    };
    validate();
  }, [queryValue, filterSelected.value, validateFn]);

  return (
    <div className={styles.container}>
      <div className={styles.inputContainer}>
        <input
          type="text"
          placeholder="Search..."
          onChange={(evt) => {
            setQueryValue(evt.target.value);
            // validate();
          }}
          onKeyDown={(evt) => evt.key === 'Enter' && doSearch()}
        />
        <div className={styles.separator}></div>
        <Select
          options={options}
          selected={filterSelected}
          onChange={(evt) => setSelectedFilter(evt)}
        />
      </div>
      <button disabled={!validState} onClick={doSearch}></button>
    </div>
  );
};
