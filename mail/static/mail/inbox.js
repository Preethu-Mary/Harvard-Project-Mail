document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Add the event listener for the compose form submission
  document.querySelector('#compose-form').onsubmit = send_email;


  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#singleEmail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#singleEmail-view').style.display = 'block';
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);
      document.querySelector('#singleEmail-view').innerHTML = `
        <p id="from"><b>From:</b>${email.sender}</p>
        <p id="to"><b>To: </b>${email.recipients}</p>
        <p id="subject"><b>Subject: </b>${email.subject}</p>
        <p id="timestamp"><b>Timestamp: </b>${email.timestamp}</p>
        <hr>
        <p id="body">${email.body}</p>
        <button id="reply" class="btn btn-outline-primary" style="margin-right: 10px;">Reply</button>
        <button id="archive" class="btn btn-outline-secondary"></button>
      `

      if(!email.read){
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }

      // Archive / UnArchive
      archive_btn = document.querySelector('#archive');
      user_email_id = document.querySelector('h2').innerHTML;
      if (user_email_id === email.sender){
        archive_btn.style.display = 'none';
      }
      if(email.archived){
        archive_btn.innerHTML = "Unarchive";
      }
      else{
        archive_btn.innerHTML = "Archive";
      }

      // Remove any existing event listeners
      archive_btn.replaceWith(archive_btn.cloneNode(true));
      const new_archive_btn = document.querySelector('#archive');
      
      new_archive_btn.addEventListener('click', function() {
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email.archived
          })
        })
        .then(() => {
          load_mailbox('inbox');
        });
      });


      // Reply
      reply_btn = document.querySelector('#reply');
      reply_btn.addEventListener('click', function(){
      compose_email();
      document.querySelector('#compose-recipients').value = email.sender;
      let sub  = email.subject
      if(sub.split(' ',1)[0] != "Re:"){
        sub = `Re: ${email.subject}`
      }
      document.querySelector('#compose-subject').value = sub;
      document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      })
  });
}
 

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#singleEmail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Get the emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    if (emails.length === 0) {
      const noEmailsMessage = document.createElement('p');
      noEmailsMessage.innerHTML = 'There are no emails to display.';
      document.querySelector('#emails-view').append(noEmailsMessage);
    } 
    else {
      emails.forEach(email => {
        console.log(email)
        const emailDiv = document.createElement('div');
        emailDiv.className = "list-group-item";
        if(email.read) {
          emailDiv.style.background = "rgb(240, 238, 238)";
        }
        else {
          emailDiv.style.background = "white";
        }
        emailDiv.innerHTML = `<h6>From: ${email.sender}<h6>
        <h6>Subject: ${email.subject}</h6>
        <p>${email.timestamp}</p>
        `;
        emailDiv.addEventListener('click', function() {
          view_email(email.id)
        });
        document.querySelector('#emails-view').append(emailDiv);
      });
    }
});
}

function send_email(event) {
  event.preventDefault();
  const recipients =  document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      load_mailbox('inbox');
      // Print result
      console.log(result);
  });
}

