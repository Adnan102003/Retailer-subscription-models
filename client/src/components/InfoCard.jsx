const InfoCard = ({ title, children }) => {
  return (
    <div className="bg-white border rounded-xl p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
};

export default InfoCard;
