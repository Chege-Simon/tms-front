
import React from 'react';
import Select from './Select';
import { countries } from '../data/countries';

interface CountrySelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange }) => {
  return (
    <Select label="Country" name="country" id="country" value={value} onChange={onChange}>
      <option value="">Select a country</option>
      {countries.map((country) => (
        <option key={country.code} value={country.name}>
          {country.name}
        </option>
      ))}
    </Select>
  );
};

export default CountrySelect;
