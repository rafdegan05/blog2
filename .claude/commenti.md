Componente React/Next.js completamente funzionante che rappresenta una sezione commenti moderna e pulita.

### Requisiti principali

- Il componente deve includere:
  1. **Barra superiore** con:
     - Campo di ricerca con placeholder dei commenti
     - Contatore totale dei commenti
     - Menu a tendina per l’ordinamento
  2. **Lista dei commenti**, ognuno con:
     - Avatar con nome utente deve essere circolare
     - Badge opzionale del ruolo con pill-style background
     - Timestamp (es. “2 hours ago”)
     - Testo del commento multilinea
     - Reazioni
     - Pulsante Rispondi, Modifica, Elimina

  3. **Box per inserire un nuovo commento**:
     - Textarea multilinea
     - Icone di formattazione (bold, italic, code, link)
     - Pulsante per inviare
     - Taggare un utente

### Linee verticali (thread lines)

- A sinistra dei commenti deve essere visibile una linea verticale sottile che collega i commenti appartenenti allo stesso thread.
- La linea deve:
  - partire dall’altezza del avatar padre
  - continuare verso il basso fino raggiungere
  - le linee devono devono collegare tutti gli avatar senza interropersi
  - all altezza delle azioni sulla linea verticale ci deve essere un pulsante con un icona di un cerchio + e - che espande e collassa i commenti
  - la linea deve essere arrotondata in modo da collegarsi agli avatar
  - il colore della line deve essere neutro
  - Per l'ultimo fratello, il ramo per creare una forma a L arrotondata e armoniosa (└──) che collega la linea verticale all'avatar
  - Per i fratelli non ultimi, la linea verticale continua dritta e un ramo orizzontale si estende a destra (├──) che collega all'avatar
  - Il pulsante di compressione cerchio meno deve essere posizionato sulla linea nella barra delle azioni

### Stile richiesto

- Design moderno, minimal, con buona spaziatura
- Tipografia leggibile
- Layout responsive
- Linee di discussione a forma circolare nei punti di congiunzione
- Le risposte devono essere visualizzate come commenti figli, indentati rispetto al commento padre.
- La profondità dell’indentazione deve aumentare progressivamente per ogni livello di annidamento.
- I commenti e le azioni devono essere annidate rispetto all'avatar

### Comportamento

- Quando un commento viene espanso o collassato, le linee devono aggiornarsi di conseguenza.
- Le linee devono essere generate dinamicamente in base alla struttura dei dati.

### Output richiesto

- Completamente funzionante
- Con markup semantico
- Con classi Tailwind ottimizzate
- Nessun codice morto o placeholder inutili
- indentazione dinamica
- linee verticali per ogni livello
- rendering ricorsivo dei commenti

### Stile visivo

- Le linee devono essere minimal, non invasive.
- Le linee devono mantenere un allineamento perfetto anche se i commenti hanno altezze diverse.
