import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

import { schema } from "./Schema";

import { ToastContainer, toast } from "react-toastify";
// The following line is not needed for react-toastify v3, only for v2.2.1
//import 'react-toastify/dist/ReactToastify.min.css';

import * as moment from "moment";
import { addPouchPlugin, createRxDatabase, getRxStoragePouch } from "rxdb";

addPouchPlugin(require("pouchdb-adapter-idb"));

const syncURL = "http://localhost:5984/";
const dbName = "chatdb";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newMessage: "",
      messages: [],
    };
    this.subs = [];
  }

  createDatabase = async () => {
    // password must have at least 8 characters
    const db = await createRxDatabase({
      name: dbName,
      storage: getRxStoragePouch("idb"),
      password: "12345678",
    });
    // show who's the leader in page's title
    db.waitForLeadership().then(() => {
      document.title = "♛ " + document.title;
    });

    // create collection
    await db.addCollections({
      messages: {
        schema: schema,
      },
    });

    // set up replication
    const replicationState = db.messages.syncCouchDB({
      remote: syncURL + dbName + "/",
    });
    this.subs.push(
      replicationState.change$.subscribe((change) => {
        toast("Replication change");
        console.dir(change);
      })
    );
    this.subs.push(
      replicationState.docs$.subscribe((docData) => console.dir(docData))
    );
    this.subs.push(
      replicationState.active$.subscribe((active) =>
        toast(`Replication active: ${active}`)
      )
    );
    this.subs.push(
      replicationState.complete$.subscribe((completed) =>
        toast(`Replication completed: ${completed}`)
      )
    );
    this.subs.push(
      replicationState.error$.subscribe((error) => {
        toast("Replication Error");
        console.dir(error);
      })
    );
    return db;
  };

  componentDidMount = async () => {
    this.db = await this.createDatabase();
    console.log(this.db);

    // Subscribe to query to get all messages
    const sub = this.db.messages
      .find()
      .sort({ id: 1 })
      .$.subscribe((messages) => {
        if (!messages) return;
        toast("Reloading messages");
        this.setState({ messages: messages });
      });
    this.subs.push(sub);
  };

  componentWillUnmount = () => {
    // Unsubscribe from all subscriptions
    this.subs.forEach((sub) => sub.unsubscribe());
  };

  render = () => {
    return (
      <div className="App">
        <ToastContainer autoClose={3000} />
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>

        <div>{this.renderMessages()}</div>

        <div id="add-message-div">
          <h3>Add Message</h3>
          <input
            type="text"
            placeholder="Message"
            value={this.state.newMessage}
            onChange={this.handleMessageChange}
          />
          <button onClick={this.addMessage}>Add message</button>
        </div>
      </div>
    );
  };

  renderMessages = () => {
    return this.state.messages.map(({ id, message }) => {
      const date = moment(id, "x").fromNow();
      return (
        <div key={id}>
          <p>{date}</p>
          <p>{message}</p>
          <hr />
        </div>
      );
    });
  };

  handleMessageChange = (event) => {
    this.setState({ newMessage: event.target.value });
  };

  addMessage = async () => {
    const id = Date.now().toString();

    const newMessage = { id, message: this.state.newMessage };

    console.log(this);
    await this.db.messages.insert(newMessage);

    this.setState({ newMessage: "" });
  };
}

export default App;
