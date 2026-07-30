import { useState, useRef, useEffect } from 'react'
import { searchParks } from '../data/parks'

export default function ParkSearchInput({ value, onChange, onSelect, placeholder }) {
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    setResults(searchParks(value))
  }, [value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="park-search" ref={wrapRef}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="park-search-results">
          {results.map((park) => (
            <button
              type="button"
              key={park.reference}
              className="park-search-result"
              onClick={() => {
                onSelect(park)
                setOpen(false)
              }}
            >
              <span className="park-search-ref">{park.reference}</span>
              <span className="park-search-name">{park.name}</span>
              <span className="park-search-loc">{park.locationDesc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
