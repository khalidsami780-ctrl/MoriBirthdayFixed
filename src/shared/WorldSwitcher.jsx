import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════════
   AGE CALCULATOR  |  Mori: 1 Mar 2009  |  Dodo: 21 Jun 2004
   (Logic preserved exactly to avoid duplication)
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
function getStatsSnapshot() {
  return PEOPLE.map(person => ({ age: calcAge(person.born), bday: calcNextBirthday(person.born) }))
}
function useStats(enabled){
  const[stats,setStats]=useState(getStatsSnapshot)
  useEffect(()=>{
    if(!enabled) return
    setStats(getStatsSnapshot())
    const id=setInterval(()=>setStats(getStatsSnapshot()),1000)
    return()=>clearInterval(id)
  },[enabled])
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
    <div style={{padding:'20px 32px',display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:12}}>
        <span style={{fontFamily:`'Cormorant Garamond',Georgia,serif`,fontStyle:'italic',fontWeight:700,fontSize:'clamp(1rem,2.8vw,1.15rem)',color:person.color,textShadow:`0 0 14px ${person.glow}`}}>
          {person.emoji} {person.name}
        </span>
        <span style={{fontFamily:`'Cormorant Garamond',Georgia,serif`,fontStyle:'italic',fontSize:'clamp(0.65rem,1.6vw,0.75rem)',color:`${person.color}88`,flexShrink:0}}>
          🎂 {bdayStr}
        </span>
      </div>
      <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12
      }}>
        <div style={{display:'flex',flexDirection:'column',gap:6,padding:'10px 14px',borderRadius:16,border:`1px solid ${person.color}22`,background:'rgba(255,255,255,0.015)'}}>
          <div style={{fontFamily:'system-ui,sans-serif',fontSize:'clamp(0.48rem,1.2vw,0.58rem)',letterSpacing:'0.12em',textTransform:'uppercase',color:`${person.color}80`}}>Age</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:'clamp(6px,2vw,12px)',flexWrap:'nowrap'}}>
            <Cell value={age.y}   label="yrs"  color={person.color}/>
            <div style={{width:1,height:26,background:'rgba(255,255,255,0.07)',alignSelf:'center',flexShrink:0}}/>
            <Cell value={p2(age.mo)}  label="mo"   color={person.color}/>
            <Cell value={p2(age.d)}   label="days" color={person.color}/>
            <Cell value={p2(age.h)}   label="hrs"  color={person.color}/>
            <Cell value={p2(age.min)} label="min"  color={person.color}/>
            <Cell value={p2(age.s)}   label="sec"  color={person.color}/>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6,padding:'10px 14px',borderRadius:16,border:`1px solid ${person.color}22`,background:`${person.color}07`}}>
          <div style={{fontFamily:'system-ui,sans-serif',fontSize:'clamp(0.48rem,1.2vw,0.58rem)',letterSpacing:'0.12em',textTransform:'uppercase',color:`${person.color}80`}}>Next Birthday</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:'clamp(6px,2vw,12px)',flexWrap:'nowrap'}}>
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

/**
 * WorldSwitcher is now just the Birthday Counter Panel.
 * It is meant to be rendered inside a container (like the Navbar popup).
 */
export default function WorldSwitcher({ isOpen }) {
  const stats = useStats(isOpen)

  if (!isOpen) return null

  return (
    <motion.div style={S.agePanel}
      initial={{ opacity:0, y:10, scale:0.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:10, scale:0.95 }}
      transition={{ duration:0.32, ease:[0.22, 1, 0.36, 1] }}
    >
      <div style={{ padding:'12px 16px 8px', display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:8 }}>
        <span style={{ fontFamily:`'Cormorant Garamond',Georgia,serif`, fontStyle:'italic', fontWeight:700, fontSize:'clamp(0.88rem,2.5vw,1.05rem)', color:'rgba(220,235,255,0.9)', letterSpacing:'0.04em' }}>
          ⏳ Ages & Upcoming Birthdays
        </span>
        <span style={{ fontFamily:'system-ui,sans-serif', fontSize:'0.52rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(126,200,240,0.38)', flexShrink:0 }}>
          LIVE
        </span>
      </div>
      <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(90,150,240,0.22),transparent)', margin:'0 16px' }}/>
      {PEOPLE.map((person, i) => (
        <div key={person.name}>
          {i > 0 && <div style={{ height:1, background:'linear-gradient(90deg,transparent,rgba(90,150,240,0.14),transparent)', margin:'0 16px' }}/>}
          <PersonCard person={person} stats={stats[i]} />
        </div>
      ))}
    </motion.div>
  )
}

const S = {
  agePanel: {
    background:'transparent', // Let the parent's glass box handle the background
    border:'none',
    boxShadow:'none',
    width:'100%',
    overflow:'hidden',
  }
}
