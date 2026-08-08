import { useEffect, useState } from 'react'

const message = [
  'شكرًا على كل حاجة حلوة كانت بينا، وعلى كل لحظة خلت أيام عادية يبقى ليها معنى أجمل.',
  'يمكن الأيام أخدت كل واحد في طريق، ويمكن حاجات كتير اتغيرت، لكن في أشخاص بيكون ليهم مكان خاص في الذاكرة، مهما بعدت الأيام.',
  'ومهما حصل، هفضل أتمنى لكِ الخير من قلبي. يمكن مش كل الكلام بيتقال، ومش كل المشاعر محتاجة شرح، لكن بعض الناس بيفضل أثرهم جميل ومكانهم عزيز.',
  'أتمنى تكملي طريقك بقلب مطمّن، وتوصلي لكل حاجة نفسك فيها، وتدخلي الكلية اللي نفسك فيها، وتلاقي في كل خطوة خير يليق بيكي.',
  'ربنا يكتب لكِ أيامًا أهدى وأجمل، ويفتح لكِ أبواب الخير والتوفيق، ويجعل القادم أجمل مما تتمنين.',
]

export default function App() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 180)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className={`farewell-page ${visible ? 'is-visible' : ''}`} dir="rtl">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <div className="stars" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={index}
            className="star"
            style={{
              '--x': `${(index * 47) % 100}%`,
              '--y': `${(index * 31 + 8) % 92}%`,
              '--delay': `${(index % 6) * 0.45}s`,
              '--size': `${index % 3 === 0 ? 3 : 2}px`,
            }}
          />
        ))}
      </div>

      <section className="farewell-shell">
        <header className="intro">
          <span className="eyebrow">كلمة أخيرة</span>
          <div className="ornament" aria-hidden="true">
            <span />
            <b>✦</b>
            <span />
          </div>
          <h1>إلى مريم</h1>
          <p className="subtitle">بكل الودّ الذي يليق بذكرى جميلة</p>
        </header>

        <article className="letter-card">
          <div className="corner corner-top" aria-hidden="true" />
          <div className="letter-mark" aria-hidden="true">♡</div>

          <div className="letter-content">
            {message.map((paragraph, index) => (
              <p key={index} className={`paragraph paragraph-${index + 1}`}>
                {paragraph}
              </p>
            ))}
          </div>

          <div className="divider" aria-hidden="true" />

          <p className="closing">
            <span>ربنا يوفقك في كل خطوة جاية</span>
            <span className="small-heart">♡</span>
          </p>
        </article>

        <footer className="footer">
          <p>بعض الأماكن في القلب لا تحتاج إلى كلام كثير.</p>
          <span>بكل خير دائمًا</span>
        </footer>
      </section>

      <style>{`
        .farewell-page {
          min-height: 100vh;
          min-height: 100dvh;
          position: relative;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 48px 20px;
          color: #f0e8dc;
          background:
            radial-gradient(circle at 50% 8%, rgba(57, 108, 190, .16), transparent 34%),
            linear-gradient(145deg, #020715 0%, #061126 48%, #030817 100%);
          font-family: 'Scheherazade New', Georgia, serif;
          opacity: 0;
          transition: opacity 1.2s ease;
        }

        .farewell-page.is-visible { opacity: 1; }

        .farewell-shell {
          position: relative;
          z-index: 2;
          width: min(720px, 100%);
          text-align: center;
        }

        .ambient {
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          opacity: .12;
        }

        .ambient-one { background: #3a7bd5; top: -150px; right: -120px; }
        .ambient-two { background: #c9a84c; bottom: -180px; left: -130px; opacity: .055; }

        .stars { position: absolute; inset: 0; pointer-events: none; }
        .star {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: var(--size);
          height: var(--size);
          border-radius: 50%;
          background: #d4e8ff;
          box-shadow: 0 0 8px rgba(168, 200, 248, .5);
          opacity: .18;
          animation: twinkle 3.8s ease-in-out infinite;
          animation-delay: var(--delay);
        }

        @keyframes twinkle {
          0%, 100% { opacity: .12; transform: scale(.8); }
          50% { opacity: .65; transform: scale(1.35); }
        }

        .intro { margin-bottom: 26px; }
        .eyebrow {
          display: block;
          color: #a8c8f8;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 13px;
          letter-spacing: .28em;
          opacity: .7;
          margin-bottom: 10px;
        }

        .ornament {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .ornament span {
          width: 42px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(232,201,126,.65));
        }

        .ornament span:last-child {
          background: linear-gradient(90deg, rgba(232,201,126,.65), transparent);
        }

        .ornament b {
          color: #e8c97e;
          font-size: 11px;
          font-weight: 400;
        }

        .intro h1 {
          margin: 0;
          color: #f4e0a8;
          font-family: 'Italiana', 'Cormorant Garamond', serif;
          font-size: clamp(42px, 9vw, 68px);
          font-weight: 400;
          line-height: 1;
          text-shadow: 0 0 40px rgba(201,168,76,.13);
        }

        .subtitle {
          margin: 13px 0 0;
          color: #b8aa98;
          font-size: clamp(15px, 3.5vw, 18px);
          opacity: .72;
        }

        .letter-card {
          position: relative;
          overflow: hidden;
          text-align: right;
          padding: clamp(30px, 7vw, 56px) clamp(24px, 7vw, 64px);
          border: 1px solid rgba(136,184,248,.13);
          border-radius: 26px;
          background: linear-gradient(145deg, rgba(8,20,48,.78), rgba(4,12,29,.82));
          box-shadow: 0 28px 80px rgba(0,0,0,.52), inset 0 1px 0 rgba(255,255,255,.035);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          transform: translateY(14px);
          transition: transform 1s cubic-bezier(.22,1,.36,1);
        }

        .is-visible .letter-card { transform: translateY(0); }

        .letter-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 75% 35% at 50% 0%, rgba(91,156,246,.08), transparent 70%);
          pointer-events: none;
        }

        .corner {
          position: absolute;
          width: 42px;
          height: 42px;
          border-color: rgba(232,201,126,.3);
          border-style: solid;
        }

        .corner-top {
          top: 15px;
          right: 15px;
          border-width: 1px 1px 0 0;
          border-radius: 0 12px 0 0;
        }

        .letter-mark {
          position: absolute;
          top: 20px;
          left: 28px;
          color: rgba(232,201,126,.4);
          font-family: Georgia, serif;
          font-size: 28px;
        }

        .letter-content { position: relative; z-index: 1; }

        .paragraph {
          margin: 0 0 21px;
          color: #d8ccbc;
          font-size: clamp(17px, 3.8vw, 20px);
          line-height: 2.05;
          font-weight: 400;
          opacity: .94;
        }

        .paragraph strong { color: #f0dfb0; font-weight: 500; }
        .paragraph:last-child { margin-bottom: 0; }

        .divider {
          width: 82px;
          height: 1px;
          margin: 28px auto 20px;
          background: linear-gradient(90deg, transparent, rgba(232,201,126,.6), transparent);
        }

        .closing {
          position: relative;
          z-index: 1;
          text-align: center;
          margin: 0;
          color: #a8c8f8;
          font-size: clamp(17px, 4vw, 20px);
          line-height: 1.9;
        }

        .small-heart {
          display: block;
          color: #e8c97e;
          font-family: Georgia, serif;
          font-size: 18px;
          margin-top: 4px;
        }

        .footer {
          margin-top: 24px;
          color: #8d9bb0;
          font-size: 14px;
          opacity: .68;
        }

        .footer p { margin: 0 0 4px; }
        .footer span {
          color: #c9a84c;
          font-family: 'Cormorant Garamond', Georgia, serif;
          letter-spacing: .08em;
          font-size: 13px;
        }

        @media (max-width: 560px) {
          .farewell-page { padding: 30px 14px; align-items: flex-start; }
          .farewell-shell { margin-top: 18px; }
          .letter-card { border-radius: 20px; }
          .paragraph { line-height: 1.95; margin-bottom: 18px; }
          .ambient { width: 260px; height: 260px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .farewell-page, .letter-card { transition: none; }
          .star { animation: none; }
        }
      `}</style>
    </main>
  )
}
