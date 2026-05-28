/* ==========================================================================
   Mak-TIC Innovation Portal & Management System - Main JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Notification Dropdown Toggle
    const notifBell = document.getElementById('notifBell');
    const notifDropdown = document.getElementById('notifDropdown');
    
    if (notifBell && notifDropdown) {
        notifBell.addEventListener('click', (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', (e) => {
            if (!notifDropdown.contains(e.target) && e.target !== notifBell) {
                notifDropdown.classList.remove('show');
            }
        });
    }

    // 2. Mark Notification as Read Helper
    window.markNotifRead = function(notifId, element) {
        fetch(`/notifications/${notifId}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                element.classList.remove('unread');
                // Decrement count if badge exists
                const badge = document.querySelector('.notif-badge');
                if (badge) {
                    let count = parseInt(badge.textContent);
                    if (count > 1) {
                        badge.textContent = count - 1;
                    } else {
                        badge.remove();
                    }
                }
            }
        })
        .catch(err => console.error('Error updating notification status:', err));
    };

    // 3. Tab System (Project Details)
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    if (tabButtons.length > 0 && tabPanes.length > 0) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                // Set active button
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Set active pane
                tabPanes.forEach(pane => {
                    if (pane.getAttribute('id') === targetTab) {
                        pane.classList.add('active');
                    } else {
                        pane.classList.remove('active');
                    }
                });
            });
        });
    }

    // 4. Project Submission Multi-Step Wizard
    const steps = document.querySelectorAll('.wizard-step');
    const panes = document.querySelectorAll('.wizard-pane');
    const nextBtns = document.querySelectorAll('.btn-next');
    const prevBtns = document.querySelectorAll('.btn-prev');
    
    let currentStep = 1;
    
    function showStep(stepNumber) {
        panes.forEach((pane, idx) => {
            if (idx + 1 === stepNumber) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
        
        steps.forEach((step, idx) => {
            if (idx + 1 === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else if (idx + 1 < stepNumber) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        currentStep = stepNumber;
    }
    
    if (panes.length > 0) {
        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Perform validation on current step
                if (validateStep(currentStep)) {
                    showStep(currentStep + 1);
                }
            });
        });
        
        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                showStep(currentStep - 1);
            });
        });
    }
    
    function validateStep(step) {
        if (step === 1) {
            const title = document.getElementById('title');
            const track = document.querySelector('input[name="track"]:checked');
            const sector = document.getElementById('sector');
            
            if (!title || !title.value.trim()) {
                alert('Please enter a project title.');
                title.focus();
                return false;
            }
            if (!track) {
                alert('Please select a project development track.');
                return false;
            }
            if (!sector || !sector.value.trim()) {
                alert('Please specify the sector tags (e.g. Agritech, IoT).');
                sector.focus();
                return false;
            }
        } else if (step === 2) {
            const desc = document.getElementById('description');
            const problem = document.getElementById('problem_statement');
            const solution = document.getElementById('proposed_solution');
            
            if (!desc || !desc.value.trim()) {
                alert('Please fill out the project description.');
                desc.focus();
                return false;
            }
            if (!problem || !problem.value.trim()) {
                alert('Please enter your problem statement.');
                problem.focus();
                return false;
            }
            if (!solution || !solution.value.trim()) {
                alert('Please describe your proposed solution.');
                solution.focus();
                return false;
            }
        }
        return true;
    }

    // 5. AI Quality Assistant Chat Widget
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatHistory = document.getElementById('chatHistory');
    let chatMessageHistory = [];
    
    if (chatSend && chatInput && chatHistory) {
        const appendMessage = (content, role) => {
            const msgDiv = document.createElement('div');
            msgDiv.classList.add('ai-message', role === 'user' ? 'user' : 'bot');
            msgDiv.textContent = content;
            chatHistory.appendChild(msgDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
            chatMessageHistory.push({ role, content });
        };
        
        const sendChatMessage = () => {
            const message = chatInput.value.trim();
            if (!message) return;
            
            appendMessage(message, 'user');
            chatInput.value = '';
            
            // Add typing indicator
            const typingDiv = document.createElement('div');
            typingDiv.classList.add('ai-message', 'bot', 'typing-indicator-msg');
            typingDiv.innerHTML = '<i>Assistant is typing...</i>';
            chatHistory.appendChild(typingDiv);
            chatHistory.scrollTop = chatHistory.scrollHeight;
            
            fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: jsonStringify({
                    message: message,
                    history: chatMessageHistory.slice(0, -1) // exclude current user message from payload history
                })
            })
            .then(res => res.json())
            .then(data => {
                typingDiv.remove();
                appendMessage(data.response, 'assistant');
            })
            .catch(err => {
                typingDiv.remove();
                appendMessage('Oops, I encountered a communication error. Please try again.', 'assistant');
                console.error(err);
            });
        };
        
        chatSend.addEventListener('click', sendChatMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
    
    // Safely serialise json strings (handles single quotes or line breaks)
    function jsonStringify(obj) {
        return JSON.stringify(obj);
    }
});
