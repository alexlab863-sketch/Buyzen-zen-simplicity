import "./Style/AuthStyle.css";

export default function LinkConfirmation() {
    return (
        <div className="auth-page-wrapper">
            <div className="auth-logo-section">
                <div className="logo" style={{fontSize: '2.5rem', fontWeight: 'bold', color: '#1a73e8'}}>Buyzen</div>
                <p className="slogan">Shop Smart, Live Easy.</p>
            </div>

            <div className="auth-card confirmation-card">
                <div className="icon-wrapper">📧</div>
                <h1>Link yuborildi!</h1>
                <p className="confirmation-text">
                    Sizning emailingizga tasdiqlash havolasi yuborildi. 
                    Iltimos, pochtangizni tekshiring va havolani ustiga bosing.
                </p>
                <div className="auth-footer">
                    <p>Xat kelmadimi? <span className="auth-link" style={{cursor: 'pointer'}}>Qayta yuborish</span></p>
                </div>
            </div>
        </div>
    );
}