/* ==========================================================================
   Mak-TIC Innovation Portal & Management System - Kanban Board JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.kanban-card');
    const containers = document.querySelectorAll('.kanban-cards-container');
    
    if (cards.length === 0 || containers.length === 0) return;
    
    // Add drag start/end to all card elements
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.getAttribute('data-project-id'));
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
    });
    
    // Set up drop zones on columns
    containers.forEach(container => {
        container.addEventListener('dragover', (e) => {
            e.preventDefault(); // Required to allow drop!
            const draggingCard = document.querySelector('.dragging');
            if (draggingCard) {
                container.appendChild(draggingCard);
            }
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const projectId = e.dataTransfer.getData('text/plain');
            const targetStage = container.getAttribute('data-stage');
            
            if (projectId && targetStage) {
                // Post update to server
                moveProjectStage(projectId, targetStage);
            }
        });
    });
    
    function moveProjectStage(projectId, stage) {
        fetch('/admin/pipeline/move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                project_id: projectId,
                stage: stage
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log(`Successfully moved project ${projectId} to stage ${stage}`);
                updateColumnCounts();
            } else {
                console.error('Failed to move project stage:', data.error);
                alert('Failed to advance project stage. Refreshing page...');
                window.location.reload();
            }
        })
        .catch(err => {
            console.error('Error during fetch operation:', err);
            alert('Communication error. Stage change could not be saved.');
            window.location.reload();
        });
    }
    
    function updateColumnCounts() {
        containers.forEach(container => {
            const stage = container.getAttribute('data-stage');
            const cardsInColumn = container.querySelectorAll('.kanban-card').length;
            
            // Find count badge in header
            const header = container.closest('.kanban-column').querySelector('.kanban-column-count');
            if (header) {
                header.textContent = cardsInColumn;
            }
        });
    }
});
