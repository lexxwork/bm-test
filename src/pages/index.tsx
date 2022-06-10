import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '/styles/App.module.scss';
import { TransactionsTableView } from 'views/TransactionsTableView';

const Home: NextPage = () => {
  return (
    <div className={styles.appContainer}>
      <Head>
        <title>BitLabMedia Test</title>
        <meta name="description" content="BitLabMedia Test App" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1>AppCo</h1>
      </header>

      <main className={styles.main}>
        <div className={styles.pageContainer}>
          <TransactionsTableView />
        </div>
      </main>

      <footer className={styles.footer}>
        <h2>AppCo</h2>
        <h3>All rights reserved by ThemeTags</h3>
        <h3>Copyrights © 2019. </h3>
      </footer>
    </div>
  );
};

export default Home;
