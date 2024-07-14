const Loading: React.FC<{ isCreating: boolean }> = ({ isCreating }) => (
  <div
    className={`p-2 pl-5 rounded-lg relative pointer-events-none ${
      isCreating ? "filter grayscale" : ""
    }`}
  >
    <div>
      <p>Creating Container...</p>
    </div>
    {isCreating && (
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r rounded-md from-white to-transparent pointer-events-none opacity-50 animate-ray" />
    )}
  </div>
);

export default Loading;
