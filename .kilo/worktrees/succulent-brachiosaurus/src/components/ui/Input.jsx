export default function Input({ ...props }) {
return (
<input
{...props}
className="w-full px-4 py-3 rounded-xl bg-green-900/60 border border-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
/>
);
}