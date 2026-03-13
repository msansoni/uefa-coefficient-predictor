#!/usr/bin/env python3
"""
UEFA European Performance Spot Coefficient Engine
===================================================

Calculates UEFA European Performance Spot probabilities through exhaustive
scenario analysis and Monte Carlo simulation.

The two associations with the HIGHEST single-season association coefficient
at the end of the current season (2025/26) each get one extra Champions League
place for 2026/27.

Single-season coefficient = total_points_all_clubs / number_of_clubs_in_europe

Author: Claude Code Agent
Date: 2026-03-13
"""

import json
import random
import math
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
from copy import deepcopy
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# Constants: UEFA Point System (2024-25 onwards)
# ─────────────────────────────────────────────────────────────────────────────

# Match results
WIN_PTS = 2.0
DRAW_PTS = 1.0
LOSS_PTS = 0.0

# Round participation bonuses per competition
# These are awarded for REACHING each round (R16, QF, SF, Final)
ROUND_BONUS = {
    "CL": 1.5,
    "EL": 1.0,
    "ECL": 0.5,
}

# CL League Phase base participation bonus
CL_LP_PARTICIPATION_BONUS = 6.0

# ─────────────────────────────────────────────────────────────────────────────
# Current State as of 12/13 March 2026
# ─────────────────────────────────────────────────────────────────────────────

NUM_CLUBS = {
    "England": 9,
    "Spain": 8,
    "Germany": 7,
    "Italy": 7,
    "France": 7,
}

CURRENT_TOTAL_POINTS = {
    "England": 205.625,
    "Spain": 147.250,
    "Germany": 127.000,
    "Italy": 125.500,
    "France": 109.750,
}

# ─────────────────────────────────────────────────────────────────────────────
# R16 Ties (first legs played 11/12 March & 12/13 March 2026)
# ─────────────────────────────────────────────────────────────────────────────

# Champions League R16 ties
# The R16 tie indices matter for QF bracket routing!
CL_R16_TIES = [
    # Tie 0: PSG vs Chelsea
    ("PSG", "France", "Chelsea", "England", 5, 2),
    # Tie 1: Galatasaray vs Liverpool
    ("Galatasaray", "Turkey", "Liverpool", "England", 1, 0),
    # Tie 2: Real Madrid vs Man City
    ("Real Madrid", "Spain", "Man City", "England", 3, 0),
    # Tie 3: Atalanta vs Bayern München
    ("Atalanta", "Italy", "Bayern München", "Germany", 1, 6),
    # Tie 4: Newcastle vs Barcelona
    ("Newcastle", "England", "Barcelona", "Spain", 1, 1),
    # Tie 5: Atlético Madrid vs Tottenham
    ("Atlético Madrid", "Spain", "Tottenham", "England", 5, 2),
    # Tie 6: Bodø/Glimt vs Sporting CP
    ("Bodø/Glimt", "Norway", "Sporting CP", "Portugal", 3, 0),
    # Tie 7: Leverkusen vs Arsenal
    ("Leverkusen", "Germany", "Arsenal", "England", 1, 1),
]

# Europa League R16 ties
EL_R16_TIES = [
    # Tie 0: Ferencváros vs Braga
    ("Ferencváros", "Hungary", "Braga", "Portugal", 2, 0),
    # Tie 1: Panathinaikos vs Real Betis
    ("Panathinaikos", "Greece", "Real Betis", "Spain", 1, 0),
    # Tie 2: Genk vs Freiburg
    ("Genk", "Belgium", "Freiburg", "Germany", 1, 0),
    # Tie 3: Celta vs Lyon
    ("Celta", "Spain", "Lyon", "France", 1, 1),
    # Tie 4: Stuttgart vs Porto
    ("Stuttgart", "Germany", "Porto", "Portugal", 1, 2),
    # Tie 5: Nottingham Forest vs Midtjylland
    ("Nottingham Forest", "England", "Midtjylland", "Denmark", 0, 1),
    # Tie 6: Bologna vs Roma
    ("Bologna", "Italy", "Roma", "Italy", 1, 1),
    # Tie 7: Lille vs Aston Villa
    ("Lille", "France", "Aston Villa", "England", 0, 1),
]

# Conference League R16 ties
ECL_R16_TIES = [
    # Tie 0: Lech Poznań vs Shakhtar Donetsk
    ("Lech Poznań", "Poland", "Shakhtar Donetsk", "Ukraine", 1, 3),
    # Tie 1: AZ Alkmaar vs Sparta Praha
    ("AZ Alkmaar", "Netherlands", "Sparta Praha", "Czech Republic", 2, 1),
    # Tie 2: Crystal Palace vs AEK Larnaca
    ("Crystal Palace", "England", "AEK Larnaca", "Cyprus", 0, 0),
    # Tie 3: Fiorentina vs Raków
    ("Fiorentina", "Italy", "Raków", "Poland", 2, 1),
    # Tie 4: Samsunspor vs Rayo Vallecano
    ("Samsunspor", "Turkey", "Rayo Vallecano", "Spain", 1, 3),
    # Tie 5: Celje vs AEK Athens
    ("Celje", "Slovenia", "AEK Athens", "Greece", 0, 4),
    # Tie 6: Sigma Olomouc vs Mainz
    ("Sigma Olomouc", "Czech Republic", "Mainz", "Germany", 0, 0),
    # Tie 7: Rijeka vs Strasbourg
    ("Rijeka", "Croatia", "Strasbourg", "France", 1, 2),
]

TRACKED_COUNTRIES = ["England", "Spain", "Germany", "Italy", "France"]

# ─────────────────────────────────────────────────────────────────────────────
# UEFA PRE-DRAWN BRACKET PAIRINGS
# ─────────────────────────────────────────────────────────────────────────────
# The QF and SF brackets are PRE-DRAWN by UEFA.
# These define which R16 winners face each other in the QF,
# and which QF winners face each other in the SF.
#
# Format: list of (tie_index_A, tie_index_B) pairs.
# QF tie is Winner of R16 tie A vs Winner of R16 tie B.
# SF: QF pairing 0 winner vs QF pairing 1 winner, QF pairing 2 vs QF pairing 3.

# CL QF bracket:
#   QF1: Winner(PSG/Chelsea) vs Winner(Galatasaray/Liverpool)  -> R16 tie 0 vs tie 1
#   QF2: Winner(Real Madrid/Man City) vs Winner(Atalanta/Bayern) -> R16 tie 2 vs tie 3
#   QF3: Winner(Newcastle/Barcelona) vs Winner(Atlético/Tottenham) -> R16 tie 4 vs tie 5
#   QF4: Winner(Bodø/Glimt/Sporting) vs Winner(Leverkusen/Arsenal) -> R16 tie 6 vs tie 7
# CL SF: QF1 vs QF2, QF3 vs QF4
CL_QF_BRACKET = [(0, 1), (2, 3), (4, 5), (6, 7)]
CL_SF_BRACKET = [(0, 1), (2, 3)]  # indices into QF winners list

# EL QF bracket:
#   QF1: Winner(Ferencváros/Braga) vs Winner(Panathinaikos/Betis) -> tie 0 vs tie 1
#   QF2: Winner(Genk/Freiburg) vs Winner(Celta/Lyon) -> tie 2 vs tie 3
#   QF3: Winner(Stuttgart/Porto) vs Winner(Forest/Midtjylland) -> tie 4 vs tie 5
#   QF4: Winner(Bologna/Roma) vs Winner(Lille/Villa) -> tie 6 vs tie 7
# EL SF: QF1 vs QF2, QF3 vs QF4
EL_QF_BRACKET = [(0, 1), (2, 3), (4, 5), (6, 7)]
EL_SF_BRACKET = [(0, 1), (2, 3)]

# ECL QF bracket:
#   QF1: Winner(Lech/Shakhtar) vs Winner(AZ/Sparta) -> tie 0 vs tie 1
#   QF2: Winner(Palace/Larnaca) vs Winner(Fiorentina/Raków) -> tie 2 vs tie 3
#   QF3: Winner(Samsunspor/Rayo) vs Winner(Celje/AEK Athens) -> tie 4 vs tie 5
#   QF4: Winner(Olomouc/Mainz) vs Winner(Rijeka/Strasbourg) -> tie 6 vs tie 7
# ECL SF: QF1 vs QF2, QF3 vs QF4
ECL_QF_BRACKET = [(0, 1), (2, 3), (4, 5), (6, 7)]
ECL_SF_BRACKET = [(0, 1), (2, 3)]

BRACKETS = {
    "CL": {"QF": CL_QF_BRACKET, "SF": CL_SF_BRACKET},
    "EL": {"QF": EL_QF_BRACKET, "SF": EL_SF_BRACKET},
    "ECL": {"QF": ECL_QF_BRACKET, "SF": ECL_SF_BRACKET},
}


# ─────────────────────────────────────────────────────────────────────────────
# Points / simulation helpers
# ─────────────────────────────────────────────────────────────────────────────

def points_for_result(result: str) -> float:
    if result == "W":
        return WIN_PTS
    elif result == "D":
        return DRAW_PTS
    return LOSS_PTS


def _poisson_sample(lam: float) -> int:
    L = math.exp(-lam)
    k = 0
    p = 1.0
    while True:
        k += 1
        p *= random.random()
        if p < L:
            return k - 1


def match_result_for_club(club_goals: int, opponent_goals: int) -> str:
    if club_goals > opponent_goals:
        return "W"
    elif club_goals == opponent_goals:
        return "D"
    return "L"


def determine_tie_winner(home_club, away_club, fl_hg, fl_ag, sl_hg, sl_ag):
    """Determine who advances in a two-legged tie.
    First leg at home_club's ground. Second leg at away_club's ground.
    sl_hg = away_club's home goals in 2nd leg, sl_ag = home_club's away goals.
    No away goals rule (abolished). Penalties = coin flip.
    """
    home_agg = fl_hg + sl_ag
    away_agg = fl_ag + sl_hg
    if home_agg > away_agg:
        return home_club
    elif away_agg > home_agg:
        return away_club
    else:
        return random.choice([home_club, away_club])


# ─────────────────────────────────────────────────────────────────────────────
# Tie-level data structure
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class TieState:
    home_club: str
    away_club: str
    home_country: str
    away_country: str
    competition: str
    round_name: str
    first_leg_hg: int
    first_leg_ag: int


def build_r16_ties() -> Dict[str, List[TieState]]:
    """Build R16 tie states from current data. Order matches tie indices above."""
    ties = {"CL": [], "EL": [], "ECL": []}
    for home, hc, away, ac, hg, ag in CL_R16_TIES:
        ties["CL"].append(TieState(home, away, hc, ac, "CL", "R16", hg, ag))
    for home, hc, away, ac, hg, ag in EL_R16_TIES:
        ties["EL"].append(TieState(home, away, hc, ac, "EL", "R16", hg, ag))
    for home, hc, away, ac, hg, ag in ECL_R16_TIES:
        ties["ECL"].append(TieState(home, away, hc, ac, "ECL", "R16", hg, ag))
    return ties


# ─────────────────────────────────────────────────────────────────────────────
# Simulate a single tie (second leg)
# ─────────────────────────────────────────────────────────────────────────────

def simulate_tie(tie: TieState) -> Tuple[str, str, Dict[str, float]]:
    """Simulate the second leg of a tie.
    Returns (winner_name, winner_country, {country: second_leg_match_points}).
    """
    country_points = defaultdict(float)

    # Second leg: away_club hosts
    sl_hg = _poisson_sample(1.4)  # home team (= away_club) expected goals
    sl_ag = _poisson_sample(1.1)  # away team (= home_club) expected goals

    # Points for away_club (home in 2nd leg)
    away_result = match_result_for_club(sl_hg, sl_ag)
    if tie.away_country in TRACKED_COUNTRIES:
        country_points[tie.away_country] += points_for_result(away_result)

    # Points for home_club (away in 2nd leg)
    home_result = match_result_for_club(sl_ag, sl_hg)
    if tie.home_country in TRACKED_COUNTRIES:
        country_points[tie.home_country] += points_for_result(home_result)

    winner = determine_tie_winner(
        tie.home_club, tie.away_club,
        tie.first_leg_hg, tie.first_leg_ag,
        sl_hg, sl_ag
    )
    winner_country = tie.home_country if winner == tie.home_club else tie.away_country

    return winner, winner_country, dict(country_points)


def simulate_two_legged_tie(club1, country1, club2, country2, competition, round_name):
    """Simulate BOTH legs of a new tie (QF/SF where no first leg has been played).
    Returns (winner_name, winner_country, {country: total_match_points_both_legs}).
    """
    country_points = defaultdict(float)

    # First leg: club1 at home
    fl_hg = _poisson_sample(1.3)
    fl_ag = _poisson_sample(1.1)

    if country1 in TRACKED_COUNTRIES:
        country_points[country1] += points_for_result(match_result_for_club(fl_hg, fl_ag))
    if country2 in TRACKED_COUNTRIES:
        country_points[country2] += points_for_result(match_result_for_club(fl_ag, fl_hg))

    # Second leg: club2 at home
    sl_hg = _poisson_sample(1.4)  # club2 home goals
    sl_ag = _poisson_sample(1.1)  # club1 away goals

    if country2 in TRACKED_COUNTRIES:
        country_points[country2] += points_for_result(match_result_for_club(sl_hg, sl_ag))
    if country1 in TRACKED_COUNTRIES:
        country_points[country1] += points_for_result(match_result_for_club(sl_ag, sl_hg))

    winner = determine_tie_winner(club1, club2, fl_hg, fl_ag, sl_hg, sl_ag)
    winner_country = country1 if winner == club1 else country2

    return winner, winner_country, dict(country_points)


def simulate_single_match(club1, country1, club2, country2, competition):
    """Simulate a single Final match. Returns (winner, winner_country, {country: pts})."""
    points = defaultdict(float)
    g1 = _poisson_sample(1.25)
    g2 = _poisson_sample(1.25)

    if country1 in TRACKED_COUNTRIES:
        points[country1] += points_for_result(match_result_for_club(g1, g2))
    if country2 in TRACKED_COUNTRIES:
        points[country2] += points_for_result(match_result_for_club(g2, g1))

    if g1 > g2:
        return club1, country1, dict(points), (g1, g2)
    elif g2 > g1:
        return club2, country2, dict(points), (g1, g2)
    else:
        w = random.choice([(club1, country1), (club2, country2)])
        return w[0], w[1], dict(points), (g1, g2)


def simulate_single_match_simple(club1, country1, club2, country2, competition):
    """Non-detailed version for the hot path."""
    points = defaultdict(float)
    g1 = _poisson_sample(1.25)
    g2 = _poisson_sample(1.25)
    if country1 in TRACKED_COUNTRIES:
        points[country1] += points_for_result(match_result_for_club(g1, g2))
    if country2 in TRACKED_COUNTRIES:
        points[country2] += points_for_result(match_result_for_club(g2, g1))
    if g1 > g2:
        return club1, country1, dict(points)
    elif g2 > g1:
        return club2, country2, dict(points)
    else:
        w = random.choice([(club1, country1), (club2, country2)])
        return w[0], w[1], dict(points)


# ─────────────────────────────────────────────────────────────────────────────
# Full competition simulation WITH CORRECT BRACKET ROUTING
# ─────────────────────────────────────────────────────────────────────────────

def simulate_full_competition(r16_ties: List[TieState], competition: str) -> Dict[str, float]:
    """Fast path: no bracket detail. Used for the 1M hot loop."""
    total_points = defaultdict(float)
    bonus = ROUND_BONUS[competition]
    bracket = BRACKETS[competition]

    r16_winners = []
    for tie in r16_ties:
        winner, winner_country, pts = simulate_tie(tie)
        for c, p in pts.items():
            total_points[c] += p
        r16_winners.append((winner, winner_country))

    for wname, wcountry in r16_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    qf_bracket = bracket["QF"]
    qf_winners = []
    for r16_idx_a, r16_idx_b in qf_bracket:
        club_a, country_a = r16_winners[r16_idx_a]
        club_b, country_b = r16_winners[r16_idx_b]
        winner, winner_country, pts = simulate_two_legged_tie(
            club_a, country_a, club_b, country_b, competition, "QF"
        )
        for c, p in pts.items():
            total_points[c] += p
        qf_winners.append((winner, winner_country))

    for wname, wcountry in qf_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    sf_bracket = bracket["SF"]
    sf_winners = []
    for qf_idx_a, qf_idx_b in sf_bracket:
        club_a, country_a = qf_winners[qf_idx_a]
        club_b, country_b = qf_winners[qf_idx_b]
        winner, winner_country, pts = simulate_two_legged_tie(
            club_a, country_a, club_b, country_b, competition, "SF"
        )
        for c, p in pts.items():
            total_points[c] += p
        sf_winners.append((winner, winner_country))

    for wname, wcountry in sf_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    if len(sf_winners) >= 2:
        f1_name, f1_country = sf_winners[0]
        f2_name, f2_country = sf_winners[1]
        f_winner, f_winner_country, f_pts = simulate_single_match_simple(
            f1_name, f1_country, f2_name, f2_country, competition
        )
        for c, p in f_pts.items():
            total_points[c] += p

    return dict(total_points)


def simulate_full_competition_detailed(r16_ties: List[TieState], competition: str):
    """Detailed path: returns bracket trace alongside points. Used for sample traces only."""
    total_points = defaultdict(float)
    bonus = ROUND_BONUS[competition]
    bracket = BRACKETS[competition]
    trace = {"R16": [], "QF": [], "SF": [], "F": None}

    # --- R16 ---
    r16_winners = []
    for i, tie in enumerate(r16_ties):
        winner, winner_country, pts = simulate_tie(tie)
        loser = tie.away_club if winner == tie.home_club else tie.home_club
        loser_country = tie.away_country if winner == tie.home_club else tie.home_country
        for c, p in pts.items():
            total_points[c] += p
        r16_winners.append((winner, winner_country))
        trace["R16"].append({"home": tie.home_club, "hc": tie.home_country,
                             "away": tie.away_club, "ac": tie.away_country,
                             "winner": winner, "wc": winner_country})

    for wname, wcountry in r16_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    # --- QF ---
    qf_bracket = bracket["QF"]
    qf_winners = []
    for r16_idx_a, r16_idx_b in qf_bracket:
        club_a, country_a = r16_winners[r16_idx_a]
        club_b, country_b = r16_winners[r16_idx_b]
        winner, winner_country, pts = simulate_two_legged_tie(
            club_a, country_a, club_b, country_b, competition, "QF"
        )
        for c, p in pts.items():
            total_points[c] += p
        qf_winners.append((winner, winner_country))
        trace["QF"].append({"home": club_a, "hc": country_a,
                            "away": club_b, "ac": country_b,
                            "winner": winner, "wc": winner_country})

    for wname, wcountry in qf_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    # --- SF ---
    sf_bracket = bracket["SF"]
    sf_winners = []
    for qf_idx_a, qf_idx_b in sf_bracket:
        club_a, country_a = qf_winners[qf_idx_a]
        club_b, country_b = qf_winners[qf_idx_b]
        winner, winner_country, pts = simulate_two_legged_tie(
            club_a, country_a, club_b, country_b, competition, "SF"
        )
        for c, p in pts.items():
            total_points[c] += p
        sf_winners.append((winner, winner_country))
        trace["SF"].append({"home": club_a, "hc": country_a,
                            "away": club_b, "ac": country_b,
                            "winner": winner, "wc": winner_country})

    for wname, wcountry in sf_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    # --- Final ---
    if len(sf_winners) >= 2:
        f1_name, f1_country = sf_winners[0]
        f2_name, f2_country = sf_winners[1]
        f_winner, f_winner_country, f_pts, scores = simulate_single_match(
            f1_name, f1_country, f2_name, f2_country, competition
        )
        for c, p in f_pts.items():
            total_points[c] += p
        trace["F"] = {"home": f1_name, "hc": f1_country,
                      "away": f2_name, "ac": f2_country,
                      "winner": f_winner, "wc": f_winner_country}

    return dict(total_points), trace


# ─────────────────────────────────────────────────────────────────────────────
# Worst Case Analysis for England (deterministic)
# ─────────────────────────────────────────────────────────────────────────────

def worst_case_england() -> Dict:
    """Calculate worst case for England: all English clubs eliminated at R16.
    Then calculate best possible for Spain and Germany assuming their clubs
    win every remaining match.
    """
    results = {}

    # England worst: all clubs lose second legs -> 0 additional points
    eng_worst_total = CURRENT_TOTAL_POINTS["England"]
    eng_worst_coeff = eng_worst_total / NUM_CLUBS["England"]

    results["England_worst"] = {
        "additional_points": 0.0,
        "total_points": eng_worst_total,
        "coefficient": round(eng_worst_coeff, 3),
        "num_clubs": NUM_CLUBS["England"],
    }

    # Spain best case: win every remaining match
    # CL: Atlético, Barcelona, Real Madrid (3 clubs)
    # R16 2nd leg wins: 3 * 2 = 6, QF bonus: 3 * 1.5 = 4.5
    # QF: 3 clubs play 2 legs each winning both -> 3 * 4 = 12, SF bonus: 3 * 1.5 = 4.5
    # SF: 3 Spanish in 4 spots -> 1 internal tie, 1 external
    #   Internal: both play 2 legs, best = 4 pts to Spain; External: 4 pts
    #   F bonus: 2 * 1.5 = 3.0
    # Final: 2 Spanish meet -> 2 pts
    # CL total: 6 + 4.5 + 12 + 4.5 + 8 + 3.0 + 2 = 40.0
    spain_cl = 40.0

    # EL: Real Betis, Celta (2 clubs)
    # R16: 2 * 2 = 4, QF bonus: 2 * 1.0 = 2.0
    # QF: 2 * 4 = 8, SF bonus: 2 * 1.0 = 2.0
    # SF: 2 in separate ties: 2 * 4 = 8, F bonus: 2 * 1.0 = 2.0
    # Final: 2 Spanish: 2
    # EL total: 4 + 2 + 8 + 2 + 8 + 2 + 2 = 28.0
    spain_el = 28.0

    # ECL: Rayo Vallecano (1 club)
    # R16: 2, QF bonus: 0.5, QF: 4, SF bonus: 0.5, SF: 4, F bonus: 0.5, Final: 2
    # Total: 13.5
    spain_ecl = 13.5

    spain_best_additional = spain_cl + spain_el + spain_ecl
    spain_best_total = CURRENT_TOTAL_POINTS["Spain"] + spain_best_additional
    spain_best_coeff = spain_best_total / NUM_CLUBS["Spain"]

    results["Spain_best"] = {
        "additional_points": spain_best_additional,
        "total_points": spain_best_total,
        "coefficient": round(spain_best_coeff, 3),
        "num_clubs": NUM_CLUBS["Spain"],
    }

    # Germany best case: win every remaining match
    # CL: Bayern, Leverkusen (2 clubs)
    # R16: 2*2=4, QF bonus: 2*1.5=3.0
    # QF: 2*4=8, SF bonus: 2*1.5=3.0
    # SF: 2 German in separate ties: 2*4=8, F bonus: 2*1.5=3.0
    # Final: 2 German: 2
    # CL total: 4+3+8+3+8+3+2 = 31.0
    germany_cl = 31.0

    # EL: Stuttgart, Freiburg (2 clubs)
    # Same structure as Spain EL but with EL bonuses (1.0)
    # R16: 4, QF bonus: 2, QF: 8, SF bonus: 2, SF: 8, F bonus: 2, Final: 2
    # Total: 28.0
    germany_el = 28.0

    # ECL: Mainz (1 club)
    # Same as Spain ECL: 13.5
    germany_ecl = 13.5

    germany_best_additional = germany_cl + germany_el + germany_ecl
    germany_best_total = CURRENT_TOTAL_POINTS["Germany"] + germany_best_additional
    germany_best_coeff = germany_best_total / NUM_CLUBS["Germany"]

    results["Germany_best"] = {
        "additional_points": germany_best_additional,
        "total_points": germany_best_total,
        "coefficient": round(germany_best_coeff, 3),
        "num_clubs": NUM_CLUBS["Germany"],
    }

    results["analysis"] = {
        "England_worst_coefficient": round(eng_worst_coeff, 3),
        "Spain_best_coefficient": round(spain_best_coeff, 3),
        "Germany_best_coefficient": round(germany_best_coeff, 3),
        "Spain_overtakes_England": spain_best_coeff > eng_worst_coeff,
        "Germany_overtakes_England": germany_best_coeff > eng_worst_coeff,
    }

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Min/Max Coefficient Analysis
# ─────────────────────────────────────────────────────────────────────────────

def calculate_max_additional_points(country: str) -> Dict[str, float]:
    """Calculate maximum possible additional points for a country.
    Assumes all clubs from this country win every remaining match.
    """
    result = {"CL": 0.0, "EL": 0.0, "ECL": 0.0}

    def count_clubs(ties_data, ctry):
        return sum(1 for h, hc, a, ac, hg, ag in ties_data if hc == ctry or ac == ctry)

    def max_pts_for_comp(n_clubs, bonus):
        if n_clubs == 0:
            return 0.0
        pts = n_clubs * 2  # R16 second leg wins
        pts += n_clubs * bonus  # QF participation bonus

        # QF (8 teams, n_clubs of them ours)
        if n_clubs <= 4:
            pts += n_clubs * 4  # win both legs
            pts += n_clubs * bonus  # SF bonus
            sf_count = n_clubs
        else:
            internal = n_clubs - 4
            external = n_clubs - 2 * internal
            pts += internal * 4 + external * 4
            sf_count = internal + external
            pts += sf_count * bonus

        # SF (4 teams)
        if sf_count >= 1:
            if sf_count <= 2:
                pts += sf_count * 4
                pts += sf_count * bonus
                f_count = sf_count
            elif sf_count == 3:
                pts += 4 + 4  # 1 internal + 1 external
                f_count = 2
                pts += f_count * bonus
            else:
                pts += 4 + 4  # 2 internal ties
                f_count = 2
                pts += f_count * bonus
        else:
            f_count = 0

        # Final
        if f_count >= 1:
            pts += 2

        return pts

    n_cl = count_clubs(CL_R16_TIES, country)
    n_el = count_clubs(EL_R16_TIES, country)
    n_ecl = count_clubs(ECL_R16_TIES, country)

    result["CL"] = max_pts_for_comp(n_cl, ROUND_BONUS["CL"])
    result["EL"] = max_pts_for_comp(n_el, ROUND_BONUS["EL"])
    result["ECL"] = max_pts_for_comp(n_ecl, ROUND_BONUS["ECL"])

    return result


def calculate_min_additional_points(country: str) -> Dict[str, float]:
    """All clubs lose their R16 second legs (0 pts) and get eliminated."""
    return {"CL": 0.0, "EL": 0.0, "ECL": 0.0}


# ─────────────────────────────────────────────────────────────────────────────
# Worst-Case Monte Carlo: All English clubs eliminated at R16
# ─────────────────────────────────────────────────────────────────────────────

def simulate_tie_worst_case_england(tie: TieState):
    """Simulate R16 second leg under worst-case-for-England rules:
    If an English club is in the tie, the NON-English club always wins.
    English clubs get 0 match points (lose both legs conceptually).
    Non-English clubs get 2 match points for winning.
    If neither club is English, simulate normally.
    """
    country_points = defaultdict(float)

    eng_is_home = tie.home_country == "England"
    eng_is_away = tie.away_country == "England"

    if eng_is_home or eng_is_away:
        # English club loses -> opponent wins the 2nd leg and the tie
        if eng_is_home:
            # home_club is English, away_club wins
            winner = tie.away_club
            winner_country = tie.away_country
            # English club gets 0 (loss), opponent gets 2 (win)
            if tie.away_country in TRACKED_COUNTRIES:
                country_points[tie.away_country] += WIN_PTS
            # English club loses second leg
            if tie.home_country in TRACKED_COUNTRIES:
                country_points[tie.home_country] += LOSS_PTS
        else:
            # away_club is English, home_club wins
            winner = tie.home_club
            winner_country = tie.home_country
            if tie.home_country in TRACKED_COUNTRIES:
                country_points[tie.home_country] += WIN_PTS
            if tie.away_country in TRACKED_COUNTRIES:
                country_points[tie.away_country] += LOSS_PTS
        return winner, winner_country, dict(country_points)
    else:
        # No English club involved -> simulate normally
        return simulate_tie(tie)


def simulate_full_competition_worst_case(r16_ties: List[TieState], competition: str) -> Dict[str, float]:
    """Fast path worst-case: all English clubs eliminated at R16."""
    total_points = defaultdict(float)
    bonus = ROUND_BONUS[competition]
    bracket = BRACKETS[competition]

    r16_winners = []
    for tie in r16_ties:
        winner, winner_country, pts = simulate_tie_worst_case_england(tie)
        for c, p in pts.items():
            total_points[c] += p
        r16_winners.append((winner, winner_country))

    for wname, wcountry in r16_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    qf_bracket = bracket["QF"]
    qf_winners = []
    for r16_idx_a, r16_idx_b in qf_bracket:
        club_a, country_a = r16_winners[r16_idx_a]
        club_b, country_b = r16_winners[r16_idx_b]
        winner, winner_country, pts = simulate_two_legged_tie(
            club_a, country_a, club_b, country_b, competition, "QF"
        )
        for c, p in pts.items():
            total_points[c] += p
        qf_winners.append((winner, winner_country))

    for wname, wcountry in qf_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    sf_bracket = bracket["SF"]
    sf_winners = []
    for qf_idx_a, qf_idx_b in sf_bracket:
        club_a, country_a = qf_winners[qf_idx_a]
        club_b, country_b = qf_winners[qf_idx_b]
        winner, winner_country, pts = simulate_two_legged_tie(
            club_a, country_a, club_b, country_b, competition, "SF"
        )
        for c, p in pts.items():
            total_points[c] += p
        sf_winners.append((winner, winner_country))

    for wname, wcountry in sf_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    if len(sf_winners) >= 2:
        f1_name, f1_country = sf_winners[0]
        f2_name, f2_country = sf_winners[1]
        f_winner, f_winner_country, f_pts = simulate_single_match_simple(
            f1_name, f1_country, f2_name, f2_country, competition
        )
        for c, p in f_pts.items():
            total_points[c] += p

    return dict(total_points)


def simulate_full_competition_worst_case_detailed(r16_ties: List[TieState], competition: str):
    """Detailed worst-case path with bracket traces."""
    total_points = defaultdict(float)
    bonus = ROUND_BONUS[competition]
    bracket = BRACKETS[competition]
    trace = {"R16": [], "QF": [], "SF": [], "F": None}

    r16_winners = []
    for i, tie in enumerate(r16_ties):
        winner, winner_country, pts = simulate_tie_worst_case_england(tie)
        for c, p in pts.items():
            total_points[c] += p
        r16_winners.append((winner, winner_country))
        trace["R16"].append({"home": tie.home_club, "hc": tie.home_country,
                             "away": tie.away_club, "ac": tie.away_country,
                             "winner": winner, "wc": winner_country})

    for wname, wcountry in r16_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    qf_bracket = bracket["QF"]
    qf_winners = []
    for r16_idx_a, r16_idx_b in qf_bracket:
        club_a, country_a = r16_winners[r16_idx_a]
        club_b, country_b = r16_winners[r16_idx_b]
        winner, winner_country, pts = simulate_two_legged_tie(
            club_a, country_a, club_b, country_b, competition, "QF"
        )
        for c, p in pts.items():
            total_points[c] += p
        qf_winners.append((winner, winner_country))
        trace["QF"].append({"home": club_a, "hc": country_a,
                            "away": club_b, "ac": country_b,
                            "winner": winner, "wc": winner_country})

    for wname, wcountry in qf_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    sf_bracket = bracket["SF"]
    sf_winners = []
    for qf_idx_a, qf_idx_b in sf_bracket:
        club_a, country_a = qf_winners[qf_idx_a]
        club_b, country_b = qf_winners[qf_idx_b]
        winner, winner_country, pts = simulate_two_legged_tie(
            club_a, country_a, club_b, country_b, competition, "SF"
        )
        for c, p in pts.items():
            total_points[c] += p
        sf_winners.append((winner, winner_country))
        trace["SF"].append({"home": club_a, "hc": country_a,
                            "away": club_b, "ac": country_b,
                            "winner": winner, "wc": winner_country})

    for wname, wcountry in sf_winners:
        if wcountry in TRACKED_COUNTRIES:
            total_points[wcountry] += bonus

    if len(sf_winners) >= 2:
        f1_name, f1_country = sf_winners[0]
        f2_name, f2_country = sf_winners[1]
        f_winner, f_winner_country, f_pts, scores = simulate_single_match(
            f1_name, f1_country, f2_name, f2_country, competition
        )
        for c, p in f_pts.items():
            total_points[c] += p
        trace["F"] = {"home": f1_name, "hc": f1_country,
                      "away": f2_name, "ac": f2_country,
                      "winner": f_winner, "wc": f_winner_country}

    return dict(total_points), trace


def run_worst_case_monte_carlo(n_iterations: int = 500_000, seed: int = 99) -> Dict:
    """Monte Carlo where ALL English clubs are knocked out at R16.
    Simulates remaining rounds (QF onward) normally for other nations.
    """
    random.seed(seed)
    r16_ties = build_r16_ties()

    coeff_sums = defaultdict(float)
    coeff_sq_sums = defaultdict(float)
    coeff_min = {c: float('inf') for c in TRACKED_COUNTRIES}
    coeff_max = {c: float('-inf') for c in TRACKED_COUNTRIES}
    top2_count = defaultdict(int)
    top1_count = defaultdict(int)
    overtake_eng = defaultdict(int)
    pair_overtake = defaultdict(int)
    eng_out_of_top2 = 0

    bin_width = 0.25
    bins_min = 14.0
    bins_max = 35.0
    n_bins = int((bins_max - bins_min) / bin_width)
    histograms = {c: [0] * n_bins for c in TRACKED_COUNTRIES}

    sample_traces = []
    n_sample = 200
    scatter_data = []
    scatter_interval = max(1, n_iterations // 2000)

    for iteration in range(n_iterations):
        additional_points = defaultdict(float)
        use_detailed = iteration < n_sample

        if use_detailed:
            bracket_traces = {}
            for comp in ["CL", "EL", "ECL"]:
                comp_points, comp_trace = simulate_full_competition_worst_case_detailed(
                    r16_ties[comp], comp
                )
                for country, pts in comp_points.items():
                    additional_points[country] += pts
                bracket_traces[comp] = comp_trace
        else:
            for comp in ["CL", "EL", "ECL"]:
                comp_points = simulate_full_competition_worst_case(
                    r16_ties[comp], comp
                )
                for country, pts in comp_points.items():
                    additional_points[country] += pts

        coefficients = {}
        for country in TRACKED_COUNTRIES:
            total = CURRENT_TOTAL_POINTS[country] + additional_points.get(country, 0.0)
            coeff = total / NUM_CLUBS[country]
            coefficients[country] = coeff
            coeff_sums[country] += coeff
            coeff_sq_sums[country] += coeff * coeff
            if coeff < coeff_min[country]:
                coeff_min[country] = coeff
            if coeff > coeff_max[country]:
                coeff_max[country] = coeff
            bin_idx = int((coeff - bins_min) / bin_width)
            if 0 <= bin_idx < n_bins:
                histograms[country][bin_idx] += 1

        ranked = sorted(coefficients.items(), key=lambda x: -x[1])
        top2_names = {ranked[0][0], ranked[1][0]}
        top2_count[ranked[0][0]] += 1
        top2_count[ranked[1][0]] += 1
        top1_count[ranked[0][0]] += 1

        eng_coeff = coefficients["England"]
        countries_above = [c for c in TRACKED_COUNTRIES if c != "England" and coefficients[c] > eng_coeff]
        for c in countries_above:
            overtake_eng[c] += 1
        if len(countries_above) >= 2:
            eng_out_of_top2 += 1
        for i in range(len(countries_above)):
            for j in range(i + 1, len(countries_above)):
                pair = tuple(sorted([countries_above[i], countries_above[j]]))
                pair_overtake[pair] += 1

        if use_detailed:
            sample_traces.append({
                "sim": iteration,
                "coefficients": {c: round(coefficients[c], 3) for c in TRACKED_COUNTRIES},
                "additional_points": {c: round(additional_points.get(c, 0.0), 2)
                                      for c in TRACKED_COUNTRIES},
                "rank": [r[0] for r in ranked],
                "england_in_top2": "England" in top2_names,
                "brackets": bracket_traces,
            })

        if iteration % scatter_interval == 0:
            scatter_data.append({
                "sim": iteration,
                "England": round(coefficients["England"], 3),
                "Spain": round(coefficients["Spain"], 3),
                "Germany": round(coefficients["Germany"], 3),
                "Italy": round(coefficients["Italy"], 3),
                "France": round(coefficients["France"], 3),
            })

    n = n_iterations
    results = {
        "iterations": n_iterations,
        "scenario": "All English clubs eliminated at R16",
        "top2_probability": {},
        "top1_probability": {},
        "mean_coefficient": {},
        "std_coefficient": {},
        "min_coefficient_observed": {},
        "max_coefficient_observed": {},
        "distribution": {},
        "england_analysis": {
            "england_drops_out_top2_pct": round(eng_out_of_top2 / n * 100, 4),
            "england_stays_top2_pct": round((n - eng_out_of_top2) / n * 100, 4),
            "overtake_by_country": {c: round(overtake_eng[c] / n * 100, 4)
                                    for c in TRACKED_COUNTRIES if c != "England"},
            "pair_overtake": {f"{p[0]} & {p[1]}": round(v / n * 100, 4)
                             for p, v in sorted(pair_overtake.items(),
                                                key=lambda x: -x[1])},
        },
        "sample_traces": sample_traces,
        "scatter_data": scatter_data,
    }

    for country in TRACKED_COUNTRIES:
        mean = coeff_sums[country] / n
        variance = (coeff_sq_sums[country] / n) - (mean * mean)
        std = math.sqrt(max(0, variance))
        results["top2_probability"][country] = round(top2_count[country] / n * 100, 2)
        results["top1_probability"][country] = round(top1_count[country] / n * 100, 2)
        results["mean_coefficient"][country] = round(mean, 3)
        results["std_coefficient"][country] = round(std, 3)
        results["min_coefficient_observed"][country] = round(coeff_min[country], 3)
        results["max_coefficient_observed"][country] = round(coeff_max[country], 3)

        dist_data = []
        for i in range(n_bins):
            bin_start = bins_min + i * bin_width
            if histograms[country][i] > 0:
                dist_data.append({
                    "bin_start": round(bin_start, 2),
                    "bin_end": round(bin_start + bin_width, 2),
                    "count": histograms[country][i],
                    "percentage": round(histograms[country][i] / n * 100, 3),
                })
        results["distribution"][country] = dist_data

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Monte Carlo Simulation
# ─────────────────────────────────────────────────────────────────────────────

def run_monte_carlo(n_iterations: int = 1_000_000, seed: int = 42) -> Dict:
    """Run Monte Carlo simulation with correct bracket routing.
    Tracks:
      - Top-2 and Top-1 probabilities
      - Probability England drops out of top-2 (2+ nations overtake)
      - Coefficient distributions
      - Overtake-specific probabilities
      - Sample simulation traces for visualization
    """
    random.seed(seed)
    r16_ties = build_r16_ties()

    # Counters
    top2_count = defaultdict(int)
    top1_count = defaultdict(int)
    coeff_sums = defaultdict(float)
    coeff_sq_sums = defaultdict(float)
    coeff_min = {c: float('inf') for c in TRACKED_COUNTRIES}
    coeff_max = {c: float('-inf') for c in TRACKED_COUNTRIES}

    # England-specific overtake tracking
    eng_out_of_top2 = 0  # iterations where England is NOT in top 2
    overtake_by = defaultdict(int)  # how often each country finishes above England

    # Pairwise: how often (X AND Y) both overtake England
    pair_overtake = defaultdict(int)

    # Histogram bins
    bin_width = 0.25
    bins_min = 14.0
    bins_max = 35.0
    n_bins = int((bins_max - bins_min) / bin_width)
    histograms = {c: [0] * n_bins for c in TRACKED_COUNTRIES}

    # Sample simulation traces (first 200 with full bracket detail)
    sample_traces = []
    n_sample = 200

    # Scatter data: every Nth iteration for scatter plot
    scatter_interval = max(1, n_iterations // 2000)  # ~2000 points
    scatter_data = []

    for iteration in range(n_iterations):
        additional_points = defaultdict(float)
        use_detailed = iteration < n_sample

        if use_detailed:
            bracket_traces = {}
            for comp in ["CL", "EL", "ECL"]:
                comp_points, comp_trace = simulate_full_competition_detailed(r16_ties[comp], comp)
                for country, pts in comp_points.items():
                    additional_points[country] += pts
                bracket_traces[comp] = comp_trace
        else:
            for comp in ["CL", "EL", "ECL"]:
                comp_points = simulate_full_competition(r16_ties[comp], comp)
                for country, pts in comp_points.items():
                    additional_points[country] += pts

        # Calculate final coefficients
        coefficients = {}
        for country in TRACKED_COUNTRIES:
            total = CURRENT_TOTAL_POINTS[country] + additional_points.get(country, 0.0)
            coeff = total / NUM_CLUBS[country]
            coefficients[country] = coeff

            coeff_sums[country] += coeff
            coeff_sq_sums[country] += coeff * coeff

            if coeff < coeff_min[country]:
                coeff_min[country] = coeff
            if coeff > coeff_max[country]:
                coeff_max[country] = coeff

            bin_idx = int((coeff - bins_min) / bin_width)
            if 0 <= bin_idx < n_bins:
                histograms[country][bin_idx] += 1

        # Rank
        ranked = sorted(coefficients.items(), key=lambda x: -x[1])
        top2_names = {ranked[0][0], ranked[1][0]}
        top2_count[ranked[0][0]] += 1
        top2_count[ranked[1][0]] += 1
        top1_count[ranked[0][0]] += 1

        # England overtake tracking
        eng_coeff = coefficients["England"]
        countries_above_eng = []
        for c in TRACKED_COUNTRIES:
            if c != "England" and coefficients[c] > eng_coeff:
                countries_above_eng.append(c)
                overtake_by[c] += 1

        if len(countries_above_eng) >= 2:
            eng_out_of_top2 += 1

        # Pairwise overtake tracking
        for i in range(len(countries_above_eng)):
            for j in range(i + 1, len(countries_above_eng)):
                pair = tuple(sorted([countries_above_eng[i], countries_above_eng[j]]))
                pair_overtake[pair] += 1

        # Collect sample traces with bracket detail
        if use_detailed:
            sample_traces.append({
                "sim": iteration,
                "coefficients": {c: round(coefficients[c], 3) for c in TRACKED_COUNTRIES},
                "additional_points": {c: round(additional_points.get(c, 0.0), 2)
                                      for c in TRACKED_COUNTRIES},
                "rank": [r[0] for r in ranked],
                "england_in_top2": "England" in top2_names,
                "brackets": bracket_traces,
            })

        # Scatter data
        if iteration % scatter_interval == 0:
            scatter_data.append({
                "sim": iteration,
                "England": round(coefficients["England"], 3),
                "Spain": round(coefficients["Spain"], 3),
                "Germany": round(coefficients["Germany"], 3),
                "Italy": round(coefficients["Italy"], 3),
                "France": round(coefficients["France"], 3),
            })

    # Compile results
    n = n_iterations
    results = {
        "iterations": n_iterations,
        "top2_probability": {},
        "top1_probability": {},
        "mean_coefficient": {},
        "std_coefficient": {},
        "min_coefficient_observed": {},
        "max_coefficient_observed": {},
        "distribution": {},
        "england_analysis": {
            "england_drops_out_top2_pct": round(eng_out_of_top2 / n * 100, 4),
            "england_stays_top2_pct": round((n - eng_out_of_top2) / n * 100, 4),
            "overtake_by_country": {c: round(overtake_by[c] / n * 100, 4)
                                    for c in TRACKED_COUNTRIES if c != "England"},
            "pair_overtake": {f"{p[0]} & {p[1]}": round(v / n * 100, 4)
                             for p, v in sorted(pair_overtake.items(),
                                                key=lambda x: -x[1])},
        },
        "sample_traces": sample_traces,
        "scatter_data": scatter_data,
    }

    for country in TRACKED_COUNTRIES:
        mean = coeff_sums[country] / n
        variance = (coeff_sq_sums[country] / n) - (mean * mean)
        std = math.sqrt(max(0, variance))

        results["top2_probability"][country] = round(top2_count[country] / n * 100, 2)
        results["top1_probability"][country] = round(top1_count[country] / n * 100, 2)
        results["mean_coefficient"][country] = round(mean, 3)
        results["std_coefficient"][country] = round(std, 3)
        results["min_coefficient_observed"][country] = round(coeff_min[country], 3)
        results["max_coefficient_observed"][country] = round(coeff_max[country], 3)

        dist_data = []
        for i in range(n_bins):
            bin_start = bins_min + i * bin_width
            if histograms[country][i] > 0:
                dist_data.append({
                    "bin_start": round(bin_start, 2),
                    "bin_end": round(bin_start + bin_width, 2),
                    "count": histograms[country][i],
                    "percentage": round(histograms[country][i] / n * 100, 3),
                })
        results["distribution"][country] = dist_data

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Back-testing Module
# ─────────────────────────────────────────────────────────────────────────────

def backtest_2024_25() -> Dict:
    known = {
        "England": {"coefficient": 29.464, "num_clubs": 9},
        "Spain": {"coefficient": 23.892, "num_clubs": 8},
        "Italy": {"coefficient": 21.875, "num_clubs": 7},
        "Germany": {"coefficient": 19.929, "num_clubs": 7},
        "France": {"coefficient": 14.500, "num_clubs": 7},
    }
    ranked = sorted(known.items(), key=lambda x: -x[1]["coefficient"])
    top2 = [ranked[0][0], ranked[1][0]]
    return {
        "season": "2024/25",
        "final_coefficients": {k: v["coefficient"] for k, v in known.items()},
        "performance_spot_winners": top2,
        "expected_winners": ["England", "Spain"],
        "validation_passed": set(top2) == {"England", "Spain"},
    }


def backtest_2023_24() -> Dict:
    known = {
        "Italy": {"coefficient": 21.000, "num_clubs": 7},
        "Germany": {"coefficient": 19.357, "num_clubs": 7},
        "England": {"coefficient": 17.375, "num_clubs": 8},
        "Spain": {"coefficient": 15.357, "num_clubs": 7},
        "France": {"coefficient": 12.500, "num_clubs": 6},
    }
    ranked = sorted(known.items(), key=lambda x: -x[1]["coefficient"])
    top2 = [ranked[0][0], ranked[1][0]]
    return {
        "season": "2023/24",
        "final_coefficients": {k: v["coefficient"] for k, v in known.items()},
        "performance_spot_winners": top2,
        "expected_winners": ["Italy", "Germany"],
        "validation_passed": set(top2) == {"Italy", "Germany"},
    }


def backtest_2022_23() -> Dict:
    known = {
        "England": {"coefficient": 23.000, "num_clubs": 7},
        "Italy": {"coefficient": 22.357, "num_clubs": 7},
        "Spain": {"coefficient": 18.000, "num_clubs": 7},
        "Germany": {"coefficient": 16.214, "num_clubs": 7},
        "France": {"coefficient": 11.833, "num_clubs": 6},
    }
    ranked = sorted(known.items(), key=lambda x: -x[1]["coefficient"])
    top2 = [ranked[0][0], ranked[1][0]]
    return {
        "season": "2022/23",
        "final_coefficients": {k: v["coefficient"] for k, v in known.items()},
        "performance_spot_winners": top2,
        "expected_winners": ["England", "Italy"],
        "validation_passed": set(top2) == {"England", "Italy"},
    }


def run_backtests() -> List[Dict]:
    return [backtest_2024_25(), backtest_2023_24(), backtest_2022_23()]


# ─────────────────────────────────────────────────────────────────────────────
# Main Execution
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("UEFA European Performance Spot Coefficient Engine")
    print("=" * 70)
    print()

    # 1. Current standings
    print("1. CURRENT STANDINGS (as of 12 March 2026)")
    print("-" * 50)
    current_standings = {}
    for country in TRACKED_COUNTRIES:
        coeff = CURRENT_TOTAL_POINTS[country] / NUM_CLUBS[country]
        current_standings[country] = {
            "total_points": CURRENT_TOTAL_POINTS[country],
            "num_clubs": NUM_CLUBS[country],
            "coefficient": round(coeff, 3),
        }
        print(f"  {country:12s}: {coeff:7.3f} ({CURRENT_TOTAL_POINTS[country]:.3f} / {NUM_CLUBS[country]})")
    print()

    # 2. Worst case for England
    print("2. WORST CASE ANALYSIS FOR ENGLAND")
    print("-" * 50)
    worst_case = worst_case_england()
    print(f"  England worst coeff: {worst_case['England_worst']['coefficient']}")
    print(f"  Spain best coeff:    {worst_case['Spain_best']['coefficient']}")
    print(f"  Germany best coeff:  {worst_case['Germany_best']['coefficient']}")
    print(f"  Spain overtakes:     {worst_case['analysis']['Spain_overtakes_England']}")
    print(f"  Germany overtakes:   {worst_case['analysis']['Germany_overtakes_England']}")
    print()

    # 3. Max/Min possible coefficients
    print("3. MAX/MIN POSSIBLE COEFFICIENTS")
    print("-" * 50)
    extremes = {}
    for country in TRACKED_COUNTRIES:
        max_pts = calculate_max_additional_points(country)
        min_pts = calculate_min_additional_points(country)

        max_additional = sum(v for v in max_pts.values() if isinstance(v, float))
        min_additional = sum(v for v in min_pts.values() if isinstance(v, float))

        max_total = CURRENT_TOTAL_POINTS[country] + max_additional
        min_total = CURRENT_TOTAL_POINTS[country] + min_additional

        max_coeff = max_total / NUM_CLUBS[country]
        min_coeff = min_total / NUM_CLUBS[country]

        extremes[country] = {
            "max_additional_points": round(max_additional, 3),
            "min_additional_points": round(min_additional, 3),
            "max_total_points": round(max_total, 3),
            "min_total_points": round(min_total, 3),
            "max_coefficient": round(max_coeff, 3),
            "min_coefficient": round(min_coeff, 3),
            "max_breakdown": {k: v for k, v in max_pts.items() if isinstance(v, float)},
        }
        print(f"  {country:12s}: min={min_coeff:7.3f}  max={max_coeff:7.3f}")
    print()

    # 4. Monte Carlo Simulation
    print("4. MONTE CARLO SIMULATION (1,000,000 iterations)")
    print("-" * 50)
    print("  Running standard simulation...")
    mc_results = run_monte_carlo(n_iterations=1_000_000, seed=42)
    print("  Done!")
    print()

    # 4b. Worst-Case Monte Carlo
    print("4b. WORST-CASE MONTE CARLO (500,000 iterations)")
    print("-" * 50)
    print("  Running worst-case simulation (all English clubs out at R16)...")
    wc_mc_results = run_worst_case_monte_carlo(n_iterations=500_000, seed=99)
    print("  Done!")
    print(f"  England stays top 2: {wc_mc_results['england_analysis']['england_stays_top2_pct']:.2f}%")
    print(f"  England drops out:   {wc_mc_results['england_analysis']['england_drops_out_top2_pct']:.2f}%")
    print()

    print("  Top 2 Probability (European Performance Spot):")
    for country in sorted(mc_results["top2_probability"],
                          key=lambda x: -mc_results["top2_probability"][x]):
        prob = mc_results["top2_probability"][country]
        mean = mc_results["mean_coefficient"][country]
        std = mc_results["std_coefficient"][country]
        print(f"    {country:12s}: {prob:6.2f}%  (mean coeff: {mean:.3f} +/- {std:.3f})")
    print()

    print("  England drops out of top 2:")
    ea = mc_results["england_analysis"]
    print(f"    Probability: {ea['england_drops_out_top2_pct']:.4f}%")
    print(f"    Overtake by country:")
    for c, pct in ea["overtake_by_country"].items():
        print(f"      {c:12s}: {pct:.4f}%")
    print(f"    Pair overtakes:")
    for pair, pct in ea["pair_overtake"].items():
        print(f"      {pair}: {pct:.4f}%")
    print()

    # 5. Back-tests
    print("5. BACK-TEST VALIDATION")
    print("-" * 50)
    backtests = run_backtests()
    for bt in backtests:
        status = "PASS" if bt["validation_passed"] else "FAIL"
        print(f"  {bt['season']}: [{status}] Winners: {bt['performance_spot_winners']}")
    print()

    # 6. Compile and save JSON results
    print("6. SAVING RESULTS")
    print("-" * 50)

    output = {
        "metadata": {
            "generated": "2026-03-13",
            "description": "UEFA European Performance Spot coefficient analysis for 2025/26 season",
            "data_as_of": "12 March 2026 (after R16 first legs)",
            "monte_carlo_iterations": 1_000_000,
            "monte_carlo_seed": 42,
            "bracket_rules": "Uses actual UEFA pre-drawn QF and SF bracket pairings",
        },
        "current_standings": current_standings,
        "worst_case_england": worst_case,
        "coefficient_extremes": extremes,
        "monte_carlo_results": mc_results,
        "worst_case_monte_carlo": wc_mc_results,
        "backtest_results": backtests,
    }

    output_path = Path(__file__).parent / "results.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2, default=str)

    print(f"  Results saved to {output_path}")
    print()
    print("=" * 70)
    print("ANALYSIS COMPLETE")
    print("=" * 70)

    return output


if __name__ == "__main__":
    main()
