---
title: Contact
layout: default
permalink: /contact.html
description: 'How to contact me.'
---
<h2 class="page-header">{{ title }}</h2>
<div class="contact-wrapper">
  <div class="column description">
    <p>Fill out the form to get in touch. Or I've got other options 👇🏻</p>
    <ul>
      <li>Ping me on <a href="https://social.lol/@cory">Mastodon</a></li>
      <li>Message me on Signal or iMessage (if you have my phone number)</li>
      <li><a href="mailto:{{ meta.email }}">Email me directly</a> if you have a client set up to use <code>mailto:</code> links</li>
      <li>File an issue on the appropriate repo over at <a href="https://github.com/cdransf">GitHub</a></li>
    </ul>
  </div>
  <form onsubmit="clicky?.log('/contact', 'Contact form submitted', 'click')" class="column" method="POST" action="/contact/success" name="contact" netlify netlify-honeypot="bot-field">
    <label class="hidden">
      Don't fill this out if you're human: <input name="bot-field" />
    </label>
    <label>
      <span class="hidden">Name</span>
      <input type="text" name="name" placeholder="Name" required />
    </label>
    <label>
      <span class="hidden">Email</span>
      <input type="email" name="email" placeholder="Email" required />
    </label>
    <textarea name="message" placeholder="Message" required></textarea>
    <div class="flex-centered justify-centered">
      <button type="submit">Send message</button>
    </div>
  </form>
</div>
