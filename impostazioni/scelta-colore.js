document.addEventListener('DOMContentLoaded', () => {
            const colorButtons = document.querySelectorAll('.color-btn');
            
            // Aggiungi un listener di eventi a ciascun pulsante del colore
            colorButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const selectedColor = button.getAttribute('data-color');
                    // Chiama la funzione per salvare e applicare il colore
                    saveAndApplyColor(selectedColor);
                });
            });
        });

        // Funzione per salvare il colore e notificare le altre pagine (se implementi la comunicazione tra pagine)
        function saveAndApplyColor(color) {
            localStorage.setItem('user-background-color', color);
            document.body.style.backgroundColor = color;
        }