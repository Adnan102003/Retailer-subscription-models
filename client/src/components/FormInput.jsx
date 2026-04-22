const FormInput = ({
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  required = true
}) => {
  return (
    <input
      className="w-full border rounded px-3 py-2"
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
    />
  );
};

export default FormInput;
