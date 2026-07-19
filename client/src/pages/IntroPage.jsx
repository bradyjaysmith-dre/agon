import { SignInButton } from '@clerk/clerk-react';
import { useState } from 'react';
import './IntroPage.css';

function IntroView() {
  return (
    <div id="intro-view">
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">A Contest Worth Having</p>

          <div className="wreath-wordmark">
            <svg className="wreath-svg" viewBox="0 0 400 160" xmlns="http://www.w3.org/2000/svg">
              <path
                className="left"
                d="M195 150 C 140 150, 70 130, 45 90 C 25 58, 35 25, 60 15 C 45 35, 42 62, 60 82 C 82 106, 130 118, 195 122"
              />
              <path
                className="right"
                d="M205 150 C 260 150, 330 130, 355 90 C 375 58, 365 25, 340 15 C 355 35, 358 62, 340 82 C 318 106, 270 118, 205 122"
              />
            </svg>
            <h1 className="wordmark">AGON</h1>
          </div>

          <p className="tagline">
            Brought to you by the creators of <b>Pandora Bingo</b>
          </p>
          <p className="subhead">
            Post a challenge. Gather your circle. Prove what you're made of — one step, one savings goal, one
            backyard tournament at a time.
          </p>

          <div className="cta-row">
            <SignInButton mode="modal">
              <a className="cta primary" href="#start">
                Start a Circle
              </a>
            </SignInButton>
            <SignInButton mode="modal">
              <a className="cta ghost" href="#open">
                See Open Challenges
              </a>
            </SignInButton>
          </div>
        </div>
      </section>

      <section className="history">
        <div className="wrap">
          <div className="divider">
            <div className="line"></div>
            <span className="glyph">ἀγών</span>
            <div className="line"></div>
          </div>

          <div className="history-grid">
            <div className="greek-word">ἀγών</div>
            <div>
              <p>
                Long before "contest" meant a trophy or a leaderboard, the Greeks had a single word for the whole
                idea: <span className="pull">agon</span> — a gathering, a struggle, a test run in public. It's the
                root buried inside <i>agony</i> and <i>protagonist</i>, which tells you something about how
                seriously they took it. An agon wasn't a side activity. It was where a person's worth got
                demonstrated, in front of everyone who mattered to them.
              </p>
              <p>
                That impulse showed up everywhere in the ancient world — not just on the running track at Olympia,
                but in the debate hall, the theater, even in politics between rival city-states. Wrestlers and
                sprinters competed for a crown of olive leaves, not a paycheck; what they were really chasing was{' '}
                <i>kleos</i>, a kind of lasting glory, and <i>arete</i>, the excellence that earns it. And for a few
                weeks every four years, the Greeks took it further still: rival states that might otherwise be at
                war declared a truce and let the games settle the score instead.
              </p>
              <p>
                Agon, the app, borrows that same shape and points it at ordinary life. The stakes are lower — a
                step-count streak, a trivia bracket, a race to save $500 — but the structure is the same one that's
                worked for three thousand years: a clear challenge, a circle of people who hold each other to it,
                and a prize that matters more for what it proves than for what it's worth. Bragging rights first.
                Everything else is optional.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AboutView() {
  return (
    <div id="about-view" className="about">
      <div className="wrap">
        <div className="about-head">
          <h2>What Agon Is</h2>
          <p>
            A place to turn a challenge into something you can actually run — with rules, a group who's in on it,
            and someone keeping score.
          </p>
        </div>

        <div className="pillars">
          <div className="pillar">
            <span className="num">01</span>
            <h3>Circles</h3>
            <p>
              Small, invite-only groups — family, friends, a team — where challenges stay visible to the people you
              actually picked. Join with a code, same as a room code, no friend-request hassle.
            </p>
          </div>
          <div className="pillar">
            <span className="num">02</span>
            <h3>Challenges</h3>
            <p>
              Anything with a start, an end, and a way to tell who won: a fitness goal, a savings race, a trivia
              gauntlet, a home-improvement sprint. The originator sets the rules — you set the pace.
            </p>
          </div>
          <div className="pillar">
            <span className="num">03</span>
            <h3>Confirmers</h3>
            <p>
              Progress gets a human check, not just an honor system. The originator or a trusted proxy signs off on
              entries — never on their own — so the leaderboard means something.
            </p>
          </div>
        </div>

        <div className="status-card">
          <span className="label">Where things stand</span>
          <p>
            Agon is in family beta. Prizes right now are bragging rights and in-app badges — no cash, no entry fees.
            That's by design while the app is young: keep the stakes real without keeping the risk high. Gift cards
            and bigger prize pools are on the roadmap for later.
          </p>
        </div>

        <p className="kin-note">
          Agon shares a builder — and a house style — with <b>Pandora Bingo</b>: real-time, low-friction, phone-first
          games made for people who already know each other.
        </p>
      </div>
    </div>
  );
}

export default function IntroPage() {
  const [tab, setTab] = useState('intro');

  return (
    <div className="intro-page">
      <nav>
        <div className="wrap">
          <button className="brand" onClick={() => setTab('intro')}>
            A<span>·</span>GON
          </button>
          <div className="tabs">
            <button
              className={`tab-btn ${tab === 'intro' ? 'active' : ''}`}
              onClick={() => setTab('intro')}
            >
              Intro
            </button>
            <button
              className={`tab-btn ${tab === 'about' ? 'active' : ''}`}
              onClick={() => setTab('about')}
            >
              About
            </button>
          </div>
        </div>
      </nav>

      {tab === 'intro' ? <IntroView /> : <AboutView />}

      <footer>
        <div className="wrap">
          <p>Agon · A Contest Worth Having</p>
        </div>
      </footer>
    </div>
  );
}
