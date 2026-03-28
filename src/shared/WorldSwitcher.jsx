import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import NotificationBell from '../components/NotificationBell.jsx'

/* ═══════════════════════════════════════════════════════════════
   AGE CALCULATOR  |  Mori: 1 Mar 2009  |  Dodo: 21 Jun 2004
═══════════════════════════════════════════════════════════════ */
const PEOPLE = [
  { name:'Mori', emoji:'💙', born:new Date(2009,2,1),  color:'#7ec8f0', glow:'rgba(126,200,240,0.6)' },
  { name:'Dodo', emoji:'🤍', born:new Date(2004,5,21), color:'#e8c97e', glow:'rgba(232,201,126,0.6)' },
]

function calcAge(born) {
  const now=new Date(); let y=now.getFullYear()-born.getFullYear(); let mo=now.getMonth()-born.getMonth()
  if(now.getDate()<born.getDate()) mo--; if(mo<0){y--;mo+=12}
  const anchor=new Date(born); anchor.setFullYear(anchor.getFullYear()+y); anchor.setMonth(anchor.getMonth()+mo)
  const rem=now-anchor,d=Math.floor(rem/86400000),h=Math.floor((rem%86400000)/3600000),
        min=Math.floor((rem%3600000)/60000),s=Math.floor((rem%60000)/1000)
  return{y,mo,d,h,min,s}
}
function calcNextBirthday(born) {
  const now=new Date(),year=now.getFullYear()
  let next=new Date(year,born.getMonth(),born.getDate())
  if(next<=now) next=new Date(year+1,born.getMonth(),born.getDate())
  const diff=next-now,d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),
        min=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000)
  return{d,h,min,s,date:next}
}
function useStats(){
  const[stats,setStats]=useState(()=>PEOPLE.map(p=>({age:calcAge(p.born),bday:calcNextBirthday(p.born)})))
  useEffect(()=>{
    const id=setInterval(()=>setStats(PEOPLE.map(p=>({age:calcAge(p.born),bday:calcNextBirthday(p.born)}))),1000)
    return()=>clearInterval(id)
  },[])
  return stats
}
const p2=n=>String(n).padStart(2,'0')

function Digit({value,color,size='1rem'}){
  return(
    <div style={{position:'relative',overflow:'hidden',lineHeight:1,height:`calc(${size} * 1.15)`}}>
      <AnimatePresence mode="popLayout">
        <motion.span key={value}
          style={{display:'block',color,fontFamily:`'SF Mono','Fira Code','Courier New',monospace`,fontWeight:700,fontSize:size}}
          initial={{y:-16,opacity:0}} animate={{y:0,opacity:1}} exit={{y:16,opacity:0}}
          transition={{duration:0.18,ease:'easeOut'}}>
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

function Cell({value,label,color,numSize='clamp(1.0rem,2.8vw,1.35rem)'}){
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:0}}>
      <div style={{display:'flex',gap:1}}>
        {String(value).split('').map((ch,i)=><Digit key={i} value={ch} color={color} size={numSize}/>)}
      </div>
      <div style={{fontFamily:'system-ui,sans-serif',fontSize:'clamp(0.44rem,1.1vw,0.56rem)',letterSpacing:'0.07em',textTransform:'uppercase',color:`${color}70`}}>{label}</div>
    </div>
  )
}

function PersonCard({person,stats}){
  const{age,bday}=stats
  const bdayStr=bday.date.toLocaleDateString('en-GB',{day:'numeric',month:'short'})
  return(
    <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:8}}>
        <span style={{fontFamily:`'Cormorant Garamond',Georgia,serif`,fontStyle:'italic',fontWeight:700,fontSize:'clamp(0.9rem,2.5vw,1.05rem)',color:person.color,textShadow:`0 0 14px ${person.glow}`}}>
          {person.emoji} {person.name}
        </span>
        <span style={{fontFamily:`'Cormorant Garamond',Georgia,serif`,fontStyle:'italic',fontSize:'clamp(0.65rem,1.6vw,0.75rem)',color:`${person.color}88`,flexShrink:0}}>
          🎂 {bdayStr}
        </span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        <div style={{display:'flex',flexDirection:'column',gap:6,padding:'7px 10px',borderRadius:12,border:`1px solid ${person.color}22`,background:'rgba(255,255,255,0.015)'}}>
          <div style={{fontFamily:'system-ui,sans-serif',fontSize:'clamp(0.48rem,1.2vw,0.58rem)',letterSpacing:'0.12em',textTransform:'uppercase',color:`${person.color}80`}}>Age</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:'clamp(4px,1.2vw,8px)',flexWrap:'nowrap'}}>
            <Cell value={age.y}   label="yrs"  color={person.color}/>
            <div style={{width:1,height:26,background:'rgba(255,255,255,0.07)',alignSelf:'center',flexShrink:0}}/>
            <Cell value={p2(age.mo)}  label="mo"   color={person.color}/>
            <Cell value={p2(age.d)}   label="days" color={person.color}/>
            <Cell value={p2(age.h)}   label="hrs"  color={person.color}/>
            <Cell value={p2(age.min)} label="min"  color={person.color}/>
            <Cell value={p2(age.s)}   label="sec"  color={person.color}/>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6,padding:'7px 10px',borderRadius:12,border:`1px solid ${person.color}22`,background:`${person.color}07`}}>
          <div style={{fontFamily:'system-ui,sans-serif',fontSize:'clamp(0.48rem,1.2vw,0.58rem)',letterSpacing:'0.12em',textTransform:'uppercase',color:`${person.color}80`}}>Next Birthday</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:'clamp(4px,1.2vw,8px)',flexWrap:'nowrap'}}>
            <Cell value={p2(bday.d)}   label="days" color={person.color} numSize="clamp(1.0rem,2.8vw,1.35rem)"/>
            <div style={{width:1,height:26,background:'rgba(255,255,255,0.07)',alignSelf:'center',flexShrink:0}}/>
            <Cell value={p2(bday.h)}   label="hrs"  color={person.color}/>
            <Cell value={p2(bday.min)} label="min"  color={person.color}/>
            <Cell value={p2(bday.s)}   label="sec"  color={person.color}/>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Orbit ring ── */
function OrbitRing({active}){
  if(active) return null
  const dots=[{s:0,speed:3.2},{s:120,speed:5.0},{s:240,speed:7.5}]
  return(
    <div style={{position:'absolute',inset:-8,borderRadius:999,pointerEvents:'none',zIndex:0,display:'flex',alignItems:'center',justifyContent:'center'}} aria-hidden="true">
      <motion.div style={{position:'absolute',inset:0,borderRadius:999,border:'1.5px dashed rgba(126,200,240,0.5)',boxShadow:'0 0 16px rgba(126,200,240,0.3)'}}
        animate={{opacity:[0.28,0.62,0.28],scale:[0.97,1.05,0.97]}}
        transition={{duration:2.2,repeat:Infinity,ease:'easeInOut'}}/>
      {dots.map((dot,i)=>(
        <motion.div key={i}
          style={{position:'absolute',inset:0,borderRadius:'50%'}}
          initial={{rotate:dot.s}} animate={{rotate:dot.s+360}}
          transition={{duration:dot.speed,repeat:Infinity,ease:'linear'}}>
          <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:5,height:5,borderRadius:'50%',background:'#7ec8f0',boxShadow:'0 0 7px 2px rgba(126,200,240,0.85)'}}/>
        </motion.div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   THREE TABS
═══════════════════════════════════════════════════════════════ */
const TABS = [
  { path: '/birthday', label: 'عيد ميلاد موري', short: 'Birthday', icon: '🎂' },
  { path: '/eid',      label: 'عيد مع موري',    short: 'Eid',      icon: '💙', isNew: true },
  { path: '/messages', label: 'رسائل ونصائح',   short: 'رسائل',   icon: '✉️', isPulse: true },
]

export default function WorldSwitcher() {
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const active       = TABS.find(t => pathname.startsWith(t.path))?.path ?? '/birthday'
  const activeIdx    = TABS.findIndex(t => t.path === active)
  const stats        = useStats()
  const [ageOpen,   setAgeOpen]   = useState(false)
  const [showOrbit, setShowOrbit] = useState(true)
  const timerRef = useRef(null)

  useEffect(()=>{
    timerRef.current=setTimeout(()=>setShowOrbit(false),8000)
    return()=>clearTimeout(timerRef.current)
  },[])
  useEffect(()=>{
    if(active==='/eid'){clearTimeout(timerRef.current);setShowOrbit(false)}
  },[active])

  return(
    <motion.div
      style={S.root}
      initial={{opacity:0,y:-20}}
      animate={{opacity:1,y:0}}
      transition={{duration:0.65,ease:[0.22,1,0.36,1],delay:0.2}}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
        {/* ── TAB PILL ──────────────────────────────────────── */}
        <div style={S.pillWrapper}>
          <div style={S.pill}>
            {/* Sliding active bg */}
            <motion.div
          style={{
            ...S.highlight,
            width: `calc(${100/3}% - 3px)`,
          }}
          animate={{ x: `${activeIdx * 100}%` }}
          transition={{type:'spring',stiffness:380,damping:32}}
        />

        {TABS.map((tab,ti)=>{
          const isActive=active===tab.path
          const isEid   =tab.path==='/eid'
          return(
            <motion.button
              key={tab.path}
              style={{...S.tab,color:isActive?'#f0e8dc':'rgba(220,235,255,0.75)'}}
              onClick={()=>navigate(tab.path)}
              whileTap={{scale:0.95}}
              aria-label={tab.label}
              aria-current={isActive?'page':undefined}
            >
              {/* Eid gets orbit ring */}
              {isEid?(
                <span style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                  {showOrbit&&<OrbitRing active={isActive}/>}
                  <motion.span animate={{scale:isActive?1.15:1}} transition={{duration:0.3}}
                    style={{lineHeight:1,fontSize:'clamp(0.88rem,2.4vw,0.98rem)',position:'relative',zIndex:1}}>
                    {tab.icon}
                  </motion.span>
                </span>
              ):(
                <motion.span animate={{scale:isActive?1.12:0.95}} transition={{duration:0.3}}
                  style={{lineHeight:1,fontSize:'clamp(0.88rem,2.4vw,0.98rem)',flexShrink:0,position:'relative'}}>
                  {tab.icon}
                  {/* Pulse dot for messages tab */}
                  {tab.isPulse&&!isActive&&(
                    <motion.span
                      style={{position:'absolute',top:-2,right:-3,width:6,height:6,borderRadius:'50%',background:'#5b9cf6',boxShadow:'0 0 8px rgba(91,156,246,0.8)'}}
                      animate={{scale:[1,1.5,1],opacity:[0.8,1,0.8]}}
                      transition={{duration:2,repeat:Infinity}}
                    />
                  )}
                </motion.span>
              )}

              <span style={S.tabLabel}>{tab.short}</span>

              {/* NEW chip on Eid */}
              <AnimatePresence>
                {isEid&&showOrbit&&!isActive&&(
                  <motion.span style={S.badge}
                    initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0,opacity:0}}>
                    ✨
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
          </div>
        </div>

        {/* ── NOTIFICATION BELL ────────────────────────────── */}
        <NotificationBell />
      </div>

      {/* ── AGE TOGGLE ─────────────────────────────────────── */}
      <motion.button
        style={S.ageToggle}
        onClick={()=>setAgeOpen(o=>!o)}
        whileHover={{scale:1.06,boxShadow:'0 0 28px rgba(126,200,240,0.35)'}}
        whileTap={{scale:0.94}}
        animate={ageOpen
          ?{borderColor:'rgba(126,200,240,0.55)',boxShadow:'0 0 22px rgba(126,200,240,0.28)'}
          :{borderColor:'rgba(90,150,240,0.3)', boxShadow:'0 4px 20px rgba(0,0,0,0.45)'}}
      >
        <motion.div style={S.toggleShimmer}
          animate={{x:['-100%','200%']}}
          transition={{duration:2.5,repeat:Infinity,ease:'easeInOut',repeatDelay:1.5}}/>
        <motion.span animate={{rotate:ageOpen?180:0}} transition={{duration:0.35}}
          style={{display:'flex',fontSize:'0.95rem',lineHeight:1,flexShrink:0}}>
          {ageOpen?'✕':'⏳'}
        </motion.span>
        <span style={S.toggleText}>{ageOpen?'Close':'Our Ages & Birthdays'}</span>
        {!ageOpen&&(
          <motion.span style={S.liveDot}
            animate={{scale:[1,1.6,1],opacity:[0.7,1,0.7]}}
            transition={{duration:1,repeat:Infinity}}/>
        )}
      </motion.button>

      {/* ── AGE PANEL ──────────────────────────────────────── */}
      <AnimatePresence>
        {ageOpen&&(
          <motion.div style={S.agePanel}
            initial={{opacity:0,y:-14,scaleY:0.75}} animate={{opacity:1,y:0,scaleY:1}}
            exit={{opacity:0,y:-10,scaleY:0.8}}
            transition={{duration:0.32,ease:[0.22,1,0.36,1]}}>
            <div style={{padding:'12px 16px 8px',display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:8}}>
              <span style={{fontFamily:`'Cormorant Garamond',Georgia,serif`,fontStyle:'italic',fontWeight:700,fontSize:'clamp(0.88rem,2.5vw,1.05rem)',color:'rgba(220,235,255,0.9)',letterSpacing:'0.04em'}}>
                ⏳ Ages &amp; Upcoming Birthdays
              </span>
              <span style={{fontFamily:'system-ui,sans-serif',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(126,200,240,0.38)',flexShrink:0}}>
                LIVE
              </span>
            </div>
            <div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(90,150,240,0.22),transparent)',margin:'0 16px'}}/>
            {PEOPLE.map((person,i)=>(
              <div key={person.name}>
                {i>0&&<div style={{height:1,background:'linear-gradient(90deg,transparent,rgba(90,150,240,0.14),transparent)',margin:'0 16px'}}/>}
                <PersonCard person={person} stats={stats[i]}/>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const S={
  root:{
    position:'fixed',top:'clamp(0.6rem,2vw,1rem)',left:0,right:0,
    marginLeft:'auto',marginRight:'auto',width:'fit-content',
    maxWidth:'calc(100vw - 1.5rem)',zIndex:500,
    display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',
  },
  pillWrapper: {
    position: 'relative', display: 'flex', flex: 1, maxWidth: '100%', minWidth: 0
  },
  pill:{
    position:'relative',display:'flex',alignItems:'center',
    background:'rgba(3,7,26,0.93)',
    backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',
    border:'1px solid rgba(100,165,255,0.38)',borderRadius:999,padding:'3px',
    boxShadow:'0 0 0 1px rgba(0,0,0,0.6),0 12px 40px rgba(0,0,0,0.75),inset 0 1px 0 rgba(255,255,255,0.08)',
    overflow:'visible',width:'100%',
  },
  highlight:{
    position:'absolute',top:3,bottom:3,left:3,
    borderRadius:996,
    background:'linear-gradient(135deg,rgba(52,110,215,0.82),rgba(26,62,145,0.92))',
    boxShadow:'0 0 24px rgba(52,110,215,0.5),inset 0 1px 0 rgba(255,255,255,0.13)',
    border:'1px solid rgba(100,165,255,0.3)',pointerEvents:'none',
  },
  tab:{
    display:'flex',alignItems:'center',gap:'clamp(3px,1vw,6px)',
    padding:'clamp(7px,2vw,10px) clamp(8px,2.5vw,16px)',
    borderRadius:996,border:'none',background:'transparent',
    cursor:'pointer',fontFamily:`'Cormorant Garamond',Georgia,serif`,
    fontWeight:600,letterSpacing:'0.04em',whiteSpace:'nowrap',
    outline:'none',WebkitTapHighlightColor:'transparent',
    transition:'color 0.28s',flex:1,justifyContent:'center',minWidth:0,
    position:'relative',zIndex:1,
  },
  tabLabel:{
    fontSize:'clamp(0.6rem,1.7vw,0.78rem)',
    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
  },
  badge:{
    display:'inline-flex',alignItems:'center',padding:'1px 5px',borderRadius:999,
    background:'linear-gradient(135deg,#3a7bd5,#5b9cf6)',
    color:'#fff',fontSize:'0.5rem',fontWeight:700,letterSpacing:'0.08em',
    fontFamily:'system-ui,sans-serif',boxShadow:'0 0 10px rgba(91,156,246,0.65)',flexShrink:0,
  },
  ageToggle:{
    position:'relative',overflow:'hidden',
    display:'flex',alignItems:'center',gap:'8px',padding:'7px 18px',
    borderRadius:999,background:'rgba(4,10,34,0.88)',
    backdropFilter:'blur(22px)',WebkitBackdropFilter:'blur(22px)',
    border:'1px solid rgba(90,150,240,0.3)',cursor:'pointer',outline:'none',
    WebkitTapHighlightColor:'transparent',
    color:'rgba(200,228,255,0.88)',transition:'border-color 0.3s,box-shadow 0.3s',
  },
  toggleShimmer:{
    position:'absolute',top:0,bottom:0,width:'40%',
    background:'linear-gradient(90deg,transparent,rgba(126,200,240,0.12),transparent)',
    pointerEvents:'none',
  },
  toggleText:{
    fontFamily:`'Cormorant Garamond',Georgia,serif`,fontStyle:'italic',fontWeight:600,
    fontSize:'clamp(0.78rem,2vw,0.92rem)',letterSpacing:'0.05em',position:'relative',zIndex:1,
  },
  liveDot:{
    width:6,height:6,borderRadius:'50%',background:'#7ec8f0',
    boxShadow:'0 0 8px rgba(126,200,240,0.8)',flexShrink:0,position:'relative',zIndex:1,
  },
  agePanel:{
    background:'rgba(3,7,26,0.96)',backdropFilter:'blur(32px)',WebkitBackdropFilter:'blur(32px)',
    border:'1px solid rgba(90,150,240,0.28)',borderRadius:18,
    boxShadow:'0 16px 60px rgba(0,0,0,0.75),inset 0 1px 0 rgba(255,255,255,0.06)',
    width:'clamp(300px,95vw,520px)',transformOrigin:'top center',overflow:'hidden',
  },
}