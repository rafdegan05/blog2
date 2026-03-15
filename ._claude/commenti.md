Componente React/Next.js completamente funzionante che rappresenta una sezione commenti moderna e pulita.

### Requisiti principal

-- Il componente deve includere:

1. **Barra superiore** con:
   - Contatore totale dei commenti
   - Campo di ricerca con placeholder dei commenti
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
  - le linee devono collegare tutti gli avatar senza interropersi
  - all altezza delle azioni sulla linea verticale ci deve essere un pulsante ⊖ che collassa i commenti
  - la linea deve essere arrotondata in modo da collegarsi agli avatar
  - il colore della line deve essere neutro
  - Per l'ultimo fratello, il ramo per creare una forma a L arrotondata e armoniosa (└──) che collega il pulsante ⊖ la linea verticale all'avatar
  - Per i fratelli non ultimi, la linea verticale continua dritta e un ramo orizzontale si estende a destra (├──) che collega all'avatar
  - Il pulsante di compressione cerchio meno deve essere posizionato sulla linea nella barra delle azioni
  - La linea del primo commento figlio deve partire dal pulsante ⊖
  - Non lasciare spazi vuoti
  - Per ogni figlio si crea un ramo a forma di L arrotondata e armoniosa (└──) che collega l'avatar padre a l'avatar figlio
  - La linea vericale non deve superare l'ultimo figlio

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

- rendering ricorsivo dei commenti

### Stile visivo

- Le linee devono essere minimal, non invasive.
- Le linee devono mantenere un allineamento perfetto anche se i commenti hanno altezze diverse.

Vertical lines:
Vertical lines connecting same-thread comments
Lines start from parent avatar
Lines connect all avatars without interruption
Collapse button (⊖) on the line must be at the height of the buttons and reactions
Rounded connections
└── for last sibling
├── for non-last siblings
Collapse button on action bar line
First child line starts from ⊖
No gaps
L-shaped branches for each child
Line doesn't extend past last child
