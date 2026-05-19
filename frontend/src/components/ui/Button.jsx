export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const cls = ['btn', `btn--${variant}`, className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}
