interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({value, onChange}) => (
  <div className="relative">
    <input
      type="text"
      placeholder="Search polls..."
      className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);
