# La Rapidité en Relativité Restreinte
## Théorie, Applications et le Problème du Rendez-vous Relativiste

---

## 1. Introduction et Motivation

### 1.1 Pourquoi la rapidité ?

En relativité restreinte, l'addition des vitesses n'est pas linéaire. La **rapidité** (notée φ) est un paramètre cinématique qui restaure cette linéarité et révèle la structure géométrique de l'espace-temps.

### 1.2 Avantages conceptuels
- **Additivité simple** : Les rapidités s'additionnent linéairement
- **Pas de limite supérieure** : φ ∈ [0, +∞[ alors que v ∈ [0, c[
- **Géométrie naturelle** : Correspond aux angles hyperboliques dans l'espace de Minkowski

---

## 2. Définitions et Relations Fondamentales

### 2.1 Définition de la rapidité

La rapidité est définie par :
```
φ = artanh(v/c) = (1/2) ln[(1 + v/c)/(1 - v/c)]
```

Réciproquement :
```
v/c = tanh(φ)
```

### 2.2 Relations avec le facteur de Lorentz

Les fonctions hyperboliques naturellement associées :
```
γ = 1/√(1 - v²/c²) = cosh(φ)
γv/c = sinh(φ)
```

Identité fondamentale : `cosh²(φ) - sinh²(φ) = 1` ⟺ `γ² - (γv/c)² = 1`

### 2.3 Comportements limites

- **Régime classique** (v ≪ c) : φ ≈ v/c
- **Régime ultra-relativiste** (v → c) : φ → +∞
- **Correspondance** : φ = 1 ⟺ v ≈ 0.76c

---

## 3. Propriété d'Additivité

### 3.1 Théorème d'addition

Si un objet A a une rapidité φ₁ dans le référentiel R₁, et R₁ a une rapidité φ₂ par rapport à R₀, alors :
```
φ_A/R₀ = φ₁ + φ₂
```

Cette relation remplace la formule d'addition relativiste des vitesses :
```
v_total = (v₁ + v₂)/(1 + v₁v₂/c²)
```

---

## 4. Temps Propre vs Temps Coordonné : Distinction Cruciale

### 4.1 Définitions

**Temps propre (τ)** : Temps mesuré par une horloge embarquée sur le vaisseau. C'est le temps vécu par l'équipage.

**Temps coordonné (t)** : Temps mesuré dans le référentiel inertiel externe (station spatiale, Terre, etc.).

### 4.2 Relation entre les deux temps

Pour un objet en mouvement à vitesse v(t) :
```
dτ/dt = 1/γ = 1/cosh(φ)
```

ou inversement :
```
dt/dτ = γ = cosh(φ)
```

**Conséquence importante** : Quand v → c, dτ/dt → 0 (dilatation temporelle extrême).

---

## 5. Accélération Propre et Force de Propulsion

### 5.1 Définition de l'accélération propre

L'**accélération propre** α est l'accélération ressentie dans le référentiel instantané du vaisseau. C'est ce que mesure un accéléromètre à bord.

**Relation avec la force de propulsion :**
```
F = m₀ α
```
où m₀ est la masse au repos du vaisseau et F est la force de poussée des moteurs.

### 5.2 Lien avec l'accélération coordonnée

L'accélération mesurée dans le référentiel inertiel est :
```
a = dv/dt = α/γ³
```

### 5.3 Évolution de la rapidité

**Point crucial** : La rapidité augmente linéairement avec le temps propre :
```
dφ/dτ = α/c
```

Pour α constant : φ(τ) = φ₀ + ατ/c

---

## 6. Cinématique à Accélération Propre Constante

### 6.1 Équations paramétriques en fonction du temps propre

Pour un vaisseau avec :
- Accélération propre constante : α
- Conditions initiales : position x₀, temps t₀, vitesse v₀ (rapidité φ₀)

**Évolution de la rapidité :**
```
φ(τ) = φ₀ + ατ/c
```

**Temps coordonné en fonction du temps propre :**
```
t(τ) = t₀ + ∫₀^τ cosh(φ(τ')) dτ'
     = t₀ + (c/α)[sinh(φ₀ + ατ/c) - sinh(φ₀)]
```

**Position en fonction du temps propre :**
```
x(τ) = x₀ + ∫₀^τ v(τ') dt' = x₀ + ∫₀^τ c tanh(φ(τ')) cosh(φ(τ')) dτ'
     = x₀ + (c²/α)[cosh(φ₀ + ατ/c) - cosh(φ₀)]
```

### 6.2 Relations inverses (t → τ)

Pour obtenir τ en fonction de t, on doit inverser :
```
t - t₀ = (c/α)[sinh(φ₀ + ατ/c) - sinh(φ₀)]
```

Cette inversion n'a pas de forme analytique simple en général.

---

## 7. Le Problème du Rendez-vous Relativiste

### 7.1 Énoncé du problème

**Données :**
- Position et temps initiaux : (x₀, t₀) dans le référentiel inertiel
- Vitesse initiale : v₀ (rapidité φ₀ = artanh(v₀/c))
- Point de rendez-vous : (x₁, t₁) dans le référentiel inertiel

**Inconnues à déterminer :**
- Accélération propre constante α (liée à la poussée F = m₀α)
- Temps propre écoulé τ_f pour l'équipage
- Rapidité finale φ_f au rendez-vous

**Contrainte physique :** |x₁ - x₀| < c|t₁ - t₀| (causalité)

### 7.2 Mise en équation

Définissons :
- Δx = x₁ - x₀ (distance à parcourir dans le référentiel)
- Δt = t₁ - t₀ (temps disponible dans le référentiel)
- β = Δx/(cΔt) (vitesse moyenne normalisée, |β| < 1)
- Δφ = φ_f - φ₀ (accroissement de rapidité)

Au temps τ_f (temps propre final), on doit avoir :
```
Δt = (c/α)[sinh(φ₀ + Δφ) - sinh(φ₀)]
Δx = (c²/α)[cosh(φ₀ + Δφ) - cosh(φ₀)]
```

### 7.3 Résolution

En divisant les deux équations :
```
β = [cosh(φ₀ + Δφ) - cosh(φ₀)]/[sinh(φ₀ + Δφ) - sinh(φ₀)]
```

En utilisant les identités hyperboliques :
```
cosh(a) - cosh(b) = 2 sinh((a+b)/2) sinh((a-b)/2)
sinh(a) - sinh(b) = 2 cosh((a+b)/2) sinh((a-b)/2)
```

On obtient :
```
β = sinh((2φ₀ + Δφ)/2) / cosh((2φ₀ + Δφ)/2) = tanh((2φ₀ + Δφ)/2)
```

D'où :
```
Δφ = 2 artanh(β) - 2φ₀
```

### 7.4 Solution complète

**Accroissement de rapidité :**
```
Δφ = 2[artanh(β) - φ₀]
```

**Accélération propre requise :**
```
α = c[sinh(φ₀ + Δφ) - sinh(φ₀)]/Δt
```

**Temps propre écoulé pour l'équipage :**
```
τ_f = cΔφ/α = Δφ Δt/[sinh(φ₀ + Δφ) - sinh(φ₀)]
```

**Rapidité et vitesse finales :**
```
φ_f = φ₀ + Δφ = 2 artanh(β) - φ₀
v_f = c tanh(φ_f)
```

---

## 8. Implémentation Pratique

### 8.1 Algorithme de calcul

**Entrées :**
- v₀, Δx, Δt

**Étapes de calcul :**
1. Calculer φ₀ = artanh(v₀/c)
2. Calculer β = Δx/(cΔt)
3. Vérifier |β| < 1 (sinon rendez-vous impossible)
4. Calculer Δφ = 2[artanh(β) - φ₀]
5. Vérifier Δφ > 0 (sinon nécessite une décélération initiale)
6. Calculer φ_f = φ₀ + Δφ
7. Calculer α = c[sinh(φ_f) - sinh(φ₀)]/Δt
8. Calculer τ_f = cΔφ/α
9. Calculer v_f = c tanh(φ_f)

### 8.2 Exemple numérique détaillé

**Données :**
- Position initiale : (0, 0)
- Vitesse initiale : v₀ = 0.3c
- Rendez-vous : (10 années-lumière, 12 ans)

**Calculs :**
```
φ₀ = artanh(0.3) = 0.3095
β = 10/12 = 0.8333
artanh(0.8333) = 1.2005
Δφ = 2(1.2005 - 0.3095) = 1.7820
φ_f = 0.3095 + 1.7820 = 2.0915
```

**Résultats :**
```
α = c[sinh(2.0915) - sinh(0.3095)]/12
  = c[4.3019 - 0.3147]/12
  = 0.3323 c/an = 9.95 m/s²

τ_f = 1.7820 × 12/3.9872 = 5.36 ans

v_f = c tanh(2.0915) = 0.9698c
```

**Interprétation physique :**
- Force de poussée constante : F = m₀ × 9.95 m/s²
- Temps vécu par l'équipage : 5.36 ans (au lieu de 12 ans)
- Vitesse finale : 97% de la vitesse de la lumière

---

## 9. Calcul de la Trajectoire Complète

### 9.1 Représentation paramétrique

Une fois α déterminé par le problème du rendez-vous, la trajectoire complète du vaisseau est donnée par les équations paramétriques :

**Position en fonction du temps propre :**
```
x(τ) = x₀ + (c²/α)[cosh(φ₀ + ατ/c) - cosh(φ₀)]
```

**Temps coordonné en fonction du temps propre :**
```
t(τ) = t₀ + (c/α)[sinh(φ₀ + ατ/c) - sinh(φ₀)]
```

**Vitesse instantanée :**
```
v(τ) = c tanh(φ₀ + ατ/c)
```

**Domaine du paramètre τ :** τ ∈ [0, τ_f] où τ_f est le temps propre final calculé précédemment.

### 9.2 Échantillonnage et calcul pratique

Pour tracer ou analyser la trajectoire, on procède ainsi :

1. **Choisir un échantillonnage en temps propre**
   ```
   N = 100  # nombre de points
   τ_points = [0, τ_f/N, 2τ_f/N, ..., τ_f]
   ```

2. **Calculer pour chaque τᵢ**
   ```
   φᵢ = φ₀ + ατᵢ/c
   xᵢ = x₀ + (c²/α)[cosh(φᵢ) - cosh(φ₀)]
   tᵢ = t₀ + (c/α)[sinh(φᵢ) - sinh(φ₀)]
   vᵢ = c tanh(φᵢ)
   γᵢ = cosh(φᵢ)
   ```

3. **Obtenir x(t) par interpolation si nécessaire**

### 9.3 Implémentation type

```python
def calculer_trajectoire(x0, t0, v0, alpha, tau_f, N=100):
    """
    Calcule la trajectoire complète du vaisseau
    
    Paramètres:
    - x0, t0: position et temps initiaux
    - v0: vitesse initiale
    - alpha: accélération propre (constante)
    - tau_f: temps propre final
    - N: nombre de points d'échantillonnage
    
    Retourne:
    - tau, x, t, v, gamma: arrays des valeurs le long de la trajectoire
    """
    c = 1  # en unités où c = 1 année-lumière/an
    phi0 = arctanh(v0/c)
    
    # Échantillonnage en temps propre
    tau = linspace(0, tau_f, N)
    
    # Rapidité à chaque instant
    phi = phi0 + alpha * tau / c
    
    # Trajectoire
    x = x0 + (c**2/alpha) * (cosh(phi) - cosh(phi0))
    t = t0 + (c/alpha) * (sinh(phi) - sinh(phi0))
    
    # Vitesse et facteur de Lorentz
    v = c * tanh(phi)
    gamma = cosh(phi)
    
    return tau, x, t, v, gamma
```

### 9.4 Exemple de trajectoire complète

Reprenons l'exemple de la section 8.2 :
- v₀ = 0.3c, rendez-vous en (10 al, 12 ans)
- α = 0.3323 c/an, τ_f = 5.36 ans

Points caractéristiques de la trajectoire :

| τ (ans) | t (ans) | x (al) | v/c | γ |
|---------|---------|--------|-----|-----|
| 0.0 | 0.0 | 0.0 | 0.300 | 1.048 |
| 1.0 | 1.5 | 0.8 | 0.607 | 1.253 |
| 2.0 | 3.4 | 2.4 | 0.795 | 1.648 |
| 3.0 | 5.6 | 4.8 | 0.894 | 2.227 |
| 4.0 | 8.1 | 7.4 | 0.944 | 3.036 |
| 5.36 | 12.0 | 10.0 | 0.970 | 4.117 |

### 9.5 Visualisation dans le diagramme espace-temps

La trajectoire forme une courbe caractéristique :
- Tangente initiale de pente 1/v₀ = 3.33 (plus raide que la lumière)
- Courbure constante dans le référentiel instantané
- Asymptote vers une ligne de lumière (pente 1) quand τ → ∞
- Passage exact par le point (10, 12)

Pour un observateur dans le référentiel inertiel :
- Le vaisseau accélère continûment
- La vitesse approche c asymptotiquement
- L'accélération apparente a = dv/dt diminue comme 1/γ³

### 9.6 Cas particulier : départ du repos

Pour v₀ = 0, on peut obtenir x(t) directement :
```
x(t) = x₀ + (c²/α)[√(1 + (α(t-t₀)/c)²) - 1]
```

Cette formule est utile pour vérifier les calculs numériques.

### 9.7 Grandeurs physiques le long de la trajectoire

**Énergie cinétique relativiste :**
```
E_k(τ) = m₀c²[cosh(φ₀ + ατ/c) - 1]
```

**Quantité de mouvement :**
```
p(τ) = m₀c sinh(φ₀ + ατ/c)
```

**Puissance nécessaire (dans le référentiel du vaisseau) :**
```
P = F·v_propre = m₀α·c tanh(ατ/c) ≈ m₀αc  (pour ατ/c >> 1)
```

---

## 10. Cas Particuliers et Validations

### 9.1 Départ du repos (v₀ = 0, φ₀ = 0)

Les formules se simplifient :
```
Δφ = 2 artanh(β)
α = c sinh(Δφ)/Δt = c sinh(2 artanh(β))/Δt
τ_f = Δφ/sinh(Δφ) × Δt
```

### 10.2 Approximation classique (β ≪ 1, v₀ ≪ c)

```
artanh(β) ≈ β
sinh(x) ≈ x pour x ≪ 1
```

Donc :
```
α ≈ 2cβ/Δt = 2Δx/Δt²
```

On retrouve la formule classique de la cinématique.

### 10.3 Conditions de validité

**Accélération positive requise si :**
```
Δφ > 0 ⟺ artanh(β) > φ₀ ⟺ β > v₀/c
```

Si cette condition n'est pas vérifiée, il faut d'abord décélérer puis réaccélérer.

---

## 11. Extensions et Considérations Pratiques

### 11.1 Profils de mission complexes

Pour une mission avec phases d'accélération et de décélération :
1. Phase 1 : Accélération de (x₀,t₀) à (x_m,t_m) avec α₁
2. Phase 2 : Décélération de (x_m,t_m) à (x₁,t₁) avec α₂

Il faut optimiser le point de transition (x_m,t_m).

### 11.2 Énergétique du Voyage Relativiste

#### 11.2.1 Énergie cinétique

L'énergie cinétique relativiste du vaisseau est :
```
E_k = (γ - 1)m₀c² = m₀c²[cosh(φ) - 1]
```

Pour le voyage, la variation d'énergie cinétique est :
```
ΔE_k = m₀c²[cosh(φ_f) - cosh(φ₀)]
     = m₀c²[cosh(φ₀ + Δφ) - cosh(φ₀)]
```

#### 11.2.2 Travail de la force de propulsion

Dans le référentiel instantané du vaisseau, le travail élémentaire est :
```
dW = F·v_rel dτ = m₀α·v_rel dτ
```

où v_rel est la vitesse d'éjection des gaz (ou vitesse des photons pour une propulsion photonique).

Pour une propulsion idéale (éjection à la vitesse de la lumière) :
```
W_total = ∫₀^τf m₀αc dτ = m₀αc·τ_f = m₀c²Δφ
```

**Résultat remarquable** : Le travail fourni est exactement m₀c² fois l'accroissement de rapidité !

#### 11.2.3 Bilan énergétique complet

L'énergie totale fournie par le système de propulsion est :
```
E_propulsion = m₀c²Δφ
```

Cette énergie se répartit en :
- Variation d'énergie cinétique du vaisseau : ΔE_k
- Énergie emportée par le fluide éjecté : E_propulsion - ΔE_k

#### 11.2.4 Exemple numérique (suite de 8.2)

Pour notre voyage de v₀ = 0.3c à v_f = 0.970c :
```
φ₀ = 0.3095
φ_f = 2.0915
Δφ = 1.7820
```

**Énergies (en unités de m₀c²) :**
```
E_k initiale = cosh(0.3095) - 1 = 0.0480
E_k finale = cosh(2.0915) - 1 = 3.1167
ΔE_k = 3.0687 m₀c²

E_propulsion = 1.7820 m₀c²
```

**Paradoxe apparent** : L'énergie fournie (1.78 m₀c²) est inférieure au gain d'énergie cinétique (3.07 m₀c²) !

**Résolution** : C'est l'effet Oberth relativiste. L'énergie est fournie dans le référentiel du vaisseau où la variation de vitesse est moindre. La différence vient de l'énergie du carburant éjecté.

#### 11.2.5 Masse de carburant nécessaire

Pour une propulsion par éjection de masse à vitesse v_e (dans le référentiel du vaisseau), l'équation de Tsiolkovsky relativiste donne :
```
m_f/m_i = exp(-Δφ/artanh(v_e/c))
```

où m_i et m_f sont les masses initiale et finale.

**Cas limites :**
- Propulsion chimique (v_e ≈ 0.00001c) : Impossible pour Δφ > 0.00001
- Propulsion ionique (v_e ≈ 0.0001c) : m_i/m_f ≈ exp(17820) → Impossible !
- Propulsion photonique (v_e = c) : m_i/m_f = exp(1.782) ≈ 5.94

**Conclusion** : Seule une propulsion proche de la vitesse de la lumière est viable pour des voyages relativistes.

#### 11.2.6 Puissance requise

La puissance dans le référentiel du vaisseau :
```
P(τ) = dW/dτ = m₀αc tanh(ατ/c)
```

Pour notre exemple, la puissance maximale (à τ = τ_f) :
```
P_max = m₀ × 0.3323c²/an × 0.970
      = 0.322 m₀c²/an
      = 9.1 × 10¹⁶ m₀ watts
```

Pour un vaisseau de 1000 tonnes : P ≈ 9.1 × 10²² W (91 000 fois la puissance du Soleil !)

#### 11.2.7 Sources d'énergie envisageables

Pour des voyages interstellaires relativistes :
1. **Fusion D-He3** : Rendement ~0.004 m₀c², insuffisant
2. **Antimatière** : Rendement = 2m₀c², idéal mais production impossible
3. **Voile photonique** : Pas de carburant mais accélération très faible
4. **Ramjet de Bussard** : Collecte l'hydrogène interstellaire, concept théorique

#### 11.2.8 Temps et énergie : le compromis

Pour un même rendez-vous, on peut réduire l'énergie en prenant plus de temps :
- Trajet rapide (Δt petit) : α élevé, E_propulsion élevée
- Trajet lent (Δt grand) : α faible, E_propulsion réduite

L'énergie minimale est atteinte pour une trajectoire balistique (α = 0 après phase initiale)

### 11.3 Effets sur l'équipage

Le temps propre τ_f < Δt signifie que l'équipage vieillit moins que les observateurs restés sur Terre. C'est le "paradoxe" des jumeaux, qui n'est pas un paradoxe mais une conséquence de la relativité.

---

## 12. Formulaire de Référence pour l'Implémentation

### Constantes et conversions
```
c = 299792458 m/s
1 année-lumière = 9.461×10¹⁵ m
1 an = 31557600 s
c = 1 année-lumière/an (unités naturelles)
```

### Fonctions hyperboliques inverses
```
artanh(x) = 0.5 ln[(1+x)/(1-x)]  pour |x| < 1
arcosh(x) = ln[x + √(x²-1)]      pour x ≥ 1
arsinh(x) = ln[x + √(x²+1)]      pour tout x
```

### Équations clés du rendez-vous
```
Entrées : v₀, Δx, Δt
φ₀ = artanh(v₀/c)
β = Δx/(cΔt)
Δφ = 2[artanh(β) - φ₀]
α = c[sinh(φ₀ + Δφ) - sinh(φ₀)]/Δt
τ_f = cΔφ/α
F = m₀α  (force de propulsion)
```

### Énergétique
```
E_propulsion = m₀c²Δφ  (énergie fournie)
ΔE_k = m₀c²[cosh(φ_f) - cosh(φ₀)]  (gain d'énergie cinétique)
m_i/m_f = exp(Δφ)  (ratio de masse pour propulsion photonique)
P_max = m₀αc tanh(Δφ)  (puissance maximale requise)
```

---

## Conclusion

Cette formulation rigoureuse distingue clairement :
- Le temps propre τ (vécu par l'équipage)
- Le temps coordonné t (mesuré dans le référentiel inertiel)
- L'accélération propre α (liée à la force F = m₀α)
- L'accroissement de rapidité Δφ (et non un paramètre ambigu u)

Les équations sont maintenant prêtes pour une implémentation directe dans un calculateur de trajectoire, sans ambiguïté sur les quantités physiques impliquées. La distinction entre temps propre et temps coordonné est cruciale : elle explique pourquoi l'équipage vieillit moins (τ_f < Δt) et comment la force de propulsion constante F = m₀α se traduit en trajectoire dans l'espace-temps.