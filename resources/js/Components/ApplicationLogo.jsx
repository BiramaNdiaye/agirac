export default function ApplicationLogo(props) {
    return (
        <img 
            {...props}
           src="/img/logo11.png"
            alt="Logo"
            className={`${props.className || ''} w-auto`}
            style={{
                width: props.width || '250px',
                height: props.height || '250px',
                maxWidth: '100%',
                objectFit: 'contain'
            }}
        />
    );
}