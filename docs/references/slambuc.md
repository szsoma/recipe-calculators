import { useState, useCallback } from "react";

// Arányok: 1 főre
const PER_PERSON = { teszta: 100, krumpli: 215, szalonna: 50 };
// szalonna arány: 500g/1000g tészta = 0.5 | krumpli: 2000g/1000g tészta = 2
// de per person: 100g tészta → 50g szalonna, 215g krumpli

const INGREDIENTS = [
  { key: "teszta",   label: "Tészta",   color: "#C4874A", unit: "g", emoji: "🍝" },
  { key: "krumpli",  label: "Krumpli",  color: "#7A9E5B", unit: "g", emoji: "🥔" },
  { key: "szalonna", label: "Szalonna", color: "#C0504A", unit: "g", emoji: "🥓" },
];

function calcFromPeople(people) {
  return {
    teszta:   Math.round(people * PER_PERSON.teszta),
    krumpli:  Math.round(people * PER_PERSON.krumpli),
    szalonna: Math.round(people * PER_PERSON.szalonna),
  };
}

function calcFromIngredient(key, value) {
  const base = value / PER_PERSON[key];
  return {
    teszta:   Math.round(base * PER_PERSON.teszta),
    krumpli:  Math.round(base * PER_PERSON.krumpli),
    szalonna: Math.round(base * PER_PERSON.szalonna),
    people:   base,
  };
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(2).replace(/\.?0+$/, "") + " kg";
  return n + " g";
}

export default function SlambucKalkulator() {
  const [mode, setMode] = useState("people"); // "people" | "ingredient"
  const [people, setPeople] = useState(4);
  const [selectedIng, setSelectedIng] = useState("teszta");
  const [ingValue, setIngValue] = useState(400);

  const resultsFromPeople = calcFromPeople(people);
  const resultsFromIng = calcFromIngredient(selectedIng, ingValue);

  const results = mode === "people" ? resultsFromPeople : resultsFromIng;
  const peopleDisplay = mode === "people" ? people : resultsFromIng.people;

  const handleIngInput = (val) => {
    const n = parseInt(val, 10);
    setIngValue(isNaN(n) || n < 0 ? 0 : n);
  };

  const handlePeopleInput = (val) => {
    const n = parseInt(val, 10);
    setPeople(isNaN(n) || n < 1 ? 1 : n);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FBF6EE",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 0 40px",
    }}>
      {/* Header */}
      <div style={{
        width: "100%",
        background: "#3B2A1A",
        padding: "28px 24px 20px",
        textAlign: "center",
        marginBottom: "24px",
      }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>🍲</div>
        <h1 style={{
          margin: 0,
          color: "#F5E8C8",
          fontSize: 22,
          fontWeight: "700",
          letterSpacing: "0.04em",
        }}>Slambuc Kalkulátor</h1>
        <p style={{
          margin: "6px 0 0",
          color: "#B89B72",
          fontSize: 13,
          fontStyle: "italic",
          letterSpacing: "0.02em",
        }}>arány számoló</p>
      </div>

      <div style={{ width: "100%", maxWidth: 420, padding: "0 16px" }}>

        {/* Mode Toggle */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "#E8DDD0",
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
        }}>
          {[
            { id: "people", label: "👥 Személyek" },
            { id: "ingredient", label: "⚖️ Alapanyag" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              style={{
                border: "none",
                borderRadius: 9,
                padding: "10px 8px",
                fontSize: 14,
                fontFamily: "inherit",
                fontWeight: mode === id ? "700" : "400",
                background: mode === id ? "#3B2A1A" : "transparent",
                color: mode === id ? "#F5E8C8" : "#7A6A56",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Input Panel */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "20px",
          marginBottom: 24,
          boxShadow: "0 2px 12px rgba(59,42,26,0.08)",
          border: "1px solid #EAE0D2",
        }}>
          {mode === "people" ? (
            <>
              <label style={{
                display: "block",
                fontSize: 13,
                color: "#7A6A56",
                marginBottom: 10,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>Személyek száma</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  onClick={() => setPeople(p => Math.max(1, p - 1))}
                  style={btnStyle}
                >−</button>
                <input
                  type="number"
                  min="1"
                  value={people}
                  onChange={e => handlePeopleInput(e.target.value)}
                  style={inputStyle}
                />
                <button
                  onClick={() => setPeople(p => p + 1)}
                  style={btnStyle}
                >+</button>
              </div>
              {/* Slider */}
              <input
                type="range"
                min="1"
                max="50"
                value={Math.min(people, 50)}
                onChange={e => setPeople(parseInt(e.target.value))}
                style={{ width: "100%", marginTop: 14, accentColor: "#C4874A" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#B89B72", marginTop: 2 }}>
                <span>1 fő</span><span>50 fő</span>
              </div>
            </>
          ) : (
            <>
              <label style={{
                display: "block",
                fontSize: 13,
                color: "#7A6A56",
                marginBottom: 10,
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>Alapanyag és mennyiség</label>

              {/* Ingredient selector */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {INGREDIENTS.map(ing => (
                  <button
                    key={ing.key}
                    onClick={() => setSelectedIng(ing.key)}
                    style={{
                      border: `2px solid ${selectedIng === ing.key ? ing.color : "#E8DDD0"}`,
                      borderRadius: 10,
                      padding: "10px 6px",
                      background: selectedIng === ing.key ? ing.color + "18" : "#FAFAF8",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 20 }}>{ing.emoji}</div>
                    <div style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: selectedIng === ing.key ? ing.color : "#7A6A56",
                      marginTop: 3,
                      fontFamily: "inherit",
                    }}>{ing.label}</div>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="number"
                  min="0"
                  value={ingValue}
                  onChange={e => handleIngInput(e.target.value)}
                  style={{ ...inputStyle, flex: 1, maxWidth: "none" }}
                />
                <span style={{ color: "#7A6A56", fontWeight: "600", fontSize: 15 }}>g</span>
              </div>
            </>
          )}
        </div>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {INGREDIENTS.map(ing => {
            const val = results[ing.key];
            const isSelected = mode === "ingredient" && selectedIng === ing.key;
            return (
              <div
                key={ing.key}
                style={{
                  background: isSelected ? "#3B2A1A" : "#fff",
                  borderRadius: 14,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: isSelected
                    ? "0 4px 18px rgba(59,42,26,0.18)"
                    : "0 2px 8px rgba(59,42,26,0.06)",
                  border: `1.5px solid ${isSelected ? "#3B2A1A" : ing.color + "40"}`,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 26 }}>{ing.emoji}</span>
                  <div>
                    <div style={{
                      fontSize: 13,
                      color: isSelected ? "#B89B72" : "#7A6A56",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}>{ing.label}</div>
                    <div style={{
                      fontSize: 11,
                      color: isSelected ? "#8A7A60" : "#B89B72",
                      marginTop: 1,
                    }}>
                      {ing.key === "teszta" && `${PER_PERSON.teszta}g / fő`}
                      {ing.key === "krumpli" && `${PER_PERSON.krumpli}g / fő`}
                      {ing.key === "szalonna" && `${PER_PERSON.szalonna}g / fő`}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontSize: 24,
                    fontWeight: "700",
                    color: isSelected ? "#F5E8C8" : ing.color,
                    lineHeight: 1,
                  }}>{formatNum(val)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div style={{
          marginTop: 20,
          background: "#F0E8D8",
          borderRadius: 12,
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid #DDD0BC",
        }}>
          <div>
            <div style={{ fontSize: 12, color: "#7A6A56", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>Összesen</div>
            <div style={{ fontSize: 20, fontWeight: "700", color: "#3B2A1A", marginTop: 2 }}>
              {formatNum(results.teszta + results.krumpli + results.szalonna)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#7A6A56", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>~Személyek</div>
            <div style={{ fontSize: 20, fontWeight: "700", color: "#3B2A1A", marginTop: 2 }}>
              {Number.isInteger(peopleDisplay)
                ? peopleDisplay
                : peopleDisplay.toFixed(1)} fő
            </div>
          </div>
        </div>

        {/* Ratio hint */}
        <p style={{
          textAlign: "center",
          fontSize: 12,
          color: "#B89B72",
          marginTop: 20,
          fontStyle: "italic",
          lineHeight: 1.6,
        }}>
          Alap arány: 100g tészta · 215g krumpli · 50g szalonna / fő
        </p>
      </div>
    </div>
  );
}

const btnStyle = {
  width: 40,
  height: 40,
  borderRadius: 10,
  border: "1.5px solid #DDD0BC",
  background: "#F5EFE6",
  fontSize: 20,
  color: "#3B2A1A",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
  flexShrink: 0,
};

const inputStyle = {
  flex: 1,
  maxWidth: 120,
  height: 40,
  borderRadius: 10,
  border: "1.5px solid #DDD0BC",
  background: "#FAFAF8",
  fontSize: 20,
  fontWeight: "700",
  color: "#3B2A1A",
  textAlign: "center",
  fontFamily: "inherit",
  outline: "none",
  padding: "0 8px",
};
