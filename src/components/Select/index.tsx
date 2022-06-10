import { useState } from 'react';
import styles from './index.module.scss';

export interface IOption {
  value: string;
  title: string;
}

export interface ISelectProps {
  options: IOption[];
  selected: IOption;
  onChange: (item: IOption) => void;
}

export const Select: React.FC<ISelectProps> = ({ options, selected, onChange }) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.buton} onClick={(e) => setIsActive(!isActive)}>
          <div>{selected.title}</div>
          <div className={styles.arrow}>&#10095;</div>
      </div>
      {isActive && (
        <div className={styles.dropDownContent}>
          {options.map((option, index) => (
            <div
              key={index}
              onClick={(e) => {
                onChange(option);
                setIsActive(false);
              }}
              className={styles.item}
            >
              {option.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
