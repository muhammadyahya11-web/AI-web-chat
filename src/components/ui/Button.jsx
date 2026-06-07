export default function Button({ children, ...props }) {
return (
<button
{...props}
className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 transition font-semibold"
>
{children}
</button>
);
}