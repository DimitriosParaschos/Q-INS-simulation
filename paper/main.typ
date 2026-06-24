#import "@preview/charged-ieee:0.1.4": ieee
#set page(numbering: "1")

#show: ieee.with(
  title: [Quantum Sensing Technologies for Inertial Navigation: A State-of-the-Art Review],
  abstract: [
    Quantum sensing has emerged as a promising approach to address long-term drift and stability limitations in conventional inertial navigation systems, particularly in GNSS-denied environments. This work presents a review of all quantum sensing technologies relevant to inertial navigation. Specifically, the paper examines cold-atom interferometers, spin-defect-based sensors, optical quantum gyroscopes, and atom–light hybrid systems. These technological developments—including quantum-enhanced photonics, matter-wave interferometry, solid-state spin sensing, and atom–light hybrid architectures, provide fundamentally different approaches to measuring inertial quantities. The paper examines the implementability of each technology in unmanned systems and platforms with physical restrictions as long as energy demands and complexity. The first technology examined is the most complex but also most promising one, namely the cold-atom interferometers. These sensors have proven to be high precision instruments that can serve as a reference for absolute measurements of both acceleration and rotation, exhibiting very low drift. Another technology examined, is the spin-defect-based sensors which are considered compact, robust quantum devices intended for long-term drift correction. Finally, there are also the so called optical quantum gyroscopes and atom–light hybrid gyroscopes. These methods represent developing technologies aimed at integrating the current benefits of existing optical interferometry with increased quantum sensitivity. This strategy, although it offers a promising method for addressing the problem using the already well established advancements in the inertial navigation domain, it also presents some notable drawbacks. For example, these technologies are specifically designed to measure angular velocities, precluding their application in the measurement of linear accelerations. In the end, the analysis reveals that no single quantum sensing technology currently satisfies all requirements for standalone inertial navigation. Although each technology introduces its own strong advantages, at the same time they suffer from considerable weaknesses The fact that no single technology can offer an ultimate solution brings up thoughts of hybrid integrations that are also presented in this work.

  ],
  authors: (
    (
      name: "c. Ph.D. Dimitrios Paraschos",
      department: [Laboratory of Machines, Intelligent and Distributed Systems],
      organization: [Hellenic Army Academy],
      location: [Athens, Greece],
      email: "dparaschos@sse.gr"
    ),
    (
      name: "Professor Nikolaos K. Papadakis, Ph.D.",
      department: [Laboratory of Machines, Intelligent and Distributed Systems],
      organization: [Hellenic Army Academy],
      location: [Athens, Greece],
      email: "npapadakis@sse.gr"
    ),
  ),
  index-terms: ("Quantum sensing", "inertial navigation", "atom interferometry", "NV centers", "squeezed light", "Sagnac interferometry", "GNSS-denied navigation"),
  figure-supplement: [Fig.],
)

= Introduction
Keeping track of the trajectory of autonomous systems presents a core difficulty even after decades of intense research. This is a core necessity for plenty of systems, particularly when satellite systems, cameras, or other forms of guidance become unavailable. Instead of depending on outside references, some technologies measure movement exclusively onboard using internal tools like gyroscopes and accelerometers. This approach which is known as dead reckoning, uses parts that detect shifts in speed or rotation through physical or light-based methods. The main problem is that a small drift appears every time a sensor takes a measurement, despite how advanced it might be. Because each new calculation builds on the last, these little errors carry forward and gradually they pile up. Therefore, position estimates bend further from reality the longer the system runs. This slow slide is what engineers call drift. Quantum sensing provides a method to address these difficulties through the application of quantum phenomena such as matter-wave interference, spin coherence, and specific light states. This enables more stable measurements and maintains precision over time @wright2022, @gersemann2025. Over a number of years, different quantum sensing approaches have been proposed and explored. In the context of this paper, we examine both dead reckoning techniques such as cold-atom interferometric sensors and optical gyroscopes enhanced through quantum methodologies while also examining techniques that require pre-loaded maps such as light devices that incorporate spin defects in solid materials @kim2025, @chang2022, @wu2020prapplied. For each technology, we examine recent papers and advancements. These systems vary based on their sensing methods, their level of complexity, their operational range, and their suitability for mobile platforms, particularly in dynamic situations such as drone flights. Understanding their strengths and weaknesses, in addition to their particular roles in navigation systems, is important for properly assessing their practical impact. For this reason, we examine both the standalone options, as well as the integration of quantum and conventional navigation systems, where the latter is generally considered the most realistic path for introducing these technologies in the near future @salducci2024sciadv, @chen2025.

= Methods
== Cold atom inertial sensors<secColdAtom>
Cold-atom inertial sensors are currently the only true quantum inertial measurement. They measure both acceleration and rotation by taking advantage of the wave characteristics of laser-cooled atoms. Right now they are believed to represent a superior class of quantum device. These interferometers deliver sensitive and precise measurements and operate without mechanical parts or the need for external calibration @wright2022, @gersemann2025. The core idea is that neutral atoms—often rubidium or cesium—are cooled to temperatures as low as microkelvin or even nanokelvin. This cooling dramatically reduces their thermal motion, which in turn minimizes noise, making it possible to observe their matter-wave nature.
Initially, the atoms are configured into a known internal quantum state and then permitted to evolve freely within a high-vacuum setting. In this stage, the atoms act mainly as unified matter waves, not as separate particles. This coherence allows for atom interferometry, which is central to how cold-atom inertial sensors operate @wright2022.
The interferometer operates by employing a series of precisely timed laser pulses that generate opposing laser fields and coherently adjust the atomic wave function. The first pulse functions as a quantum beam splitter and leads to a coherent momentum exchange between the atoms and these opposing laser fields. Each atom then finds itself in a state where it simultaneously possesses two different momenta, which causes it to travel along two distinct paths in space. As the system evolves freely, inertial influences like acceleration and rotation cause a variance in the quantum phases. This happens because atoms travel along distinct spacetime paths within the non-inertial frame of reference, creating a slight shift. After the free-evolution period, a second pulse reverses the relative momenta of the two trajectories, initiating their convergence, and finally the last laser pulse recombines them to produce interference. This recombination converts the otherwise unobservable phase difference into a measurable population imbalance between internal atomic states. The populations are read out through state-selective fluorescence detection, typically using photodetectors or cameras and this way, phase information is transformed into an optical signal that directly encodes the experienced acceleration or rotation @wright2022.
Most practical sensors use laser-cooled ensembles at microkelvin temperatures. One subset of cold atom interferometers are the BEC-based sensors, as discussed by Gersemann et al. @gersemann2025.
In order to understand the complexity of such a process, the generation process of Bose–Einstein condensation is illustrated in @figureBose.

#figure(
  image("Images/Bose-steps.svg", width: 100%),
  caption: [The Bose-Einstein Condensate creation process as a flow diagram]
)<figureBose>

The complexity of achieving a Bose-Einstein Condensate (BEC) with Rubidium atoms involves a multi-stage cooling process where perfectly timed lasers provide the initial cooling, while also magnetic fields and evaporative cooling stages are required to reach the final quantum state. Here is the brief process (see @figureBose): 

1. Laser Cooling (The Magneto-Optical Trap - MOT):
  - A vapor of Rubidium-87 atoms is released into a vacuum chamber.
  - Six laser beams (one from each direction: up, down, left, right, front, back) are tuned to a frequency just below Rubidium's specific electronic transition frequency (red-detuned).
  - Due to the Doppler effect, atoms moving toward a laser beam "see" the light shifted to the correct frequency and absorb photons, slowing them down.
  - This creates "Optical Molasses," cooling the atoms to approximately 100 microkelvin.        

2. Magnetic Trapping: 
- The lasers are turned off, and the atoms are transferred into a purely magnetic trap (often a "quadrupole" or "Ioffe-Pritchard" trap). This trap uses magnetic field gradients to confine the cold atoms in space.
3. Evaporative Cooling: 
  - This is the critical step lasers cannot achieve alone. Radiofrequency (RF) radiation is applied to the magnetic trap.
  - The RF field flips the spin of the most energetic (hottest) atoms, causing them to become untrapped and fly out of the system.
  - The remaining atoms re-thermalize (collide) at a lower average temperature.
  - By gradually lowering the frequency, more hot atoms are ejected, cooling the cloud to nanokelvin temperatures (around 100 nK).
4. Condensation: 
  - Once the critical temperature is reached (where the de Broglie wavelength overlaps), the atoms collapse into the lowest quantum ground state, forming the BEC.

The resulting Bose–Einstein condensate and its temperature dependence are illustrated in @figureBEC and @figureTempDistro.
 
#figure(
  image("Images/BEC6.svg", width: 100%),
  caption: [The Bose-Einstein Condensate ]
)<figureBEC>

#figure(
  image("Images/BEC7.svg", width: 100%),
  caption: [The Bose-Einstein Condensate in relation to temperature]
)<figureTempDistro>

When we review the publicly available work on cold-atom inertial sensors, it becomes clear that they perform better than the traditional inertial systems. The critical thing to note is that their measurements are based entirely on identical atoms and fundamental light–matter interactions. This contributes to their very low bias drift and allows for long-term stability in their operation. However, this level of performance demands precise manipulation of laser frequency, phase, and timing. One must also sustain atomic coherence, which presents practical engineering challenges for deployment and makes implementation on small scale drones impossible. This is not the case for uncrewed mobile platforms in general although it is quite difficult. As an example, the quantum sensors being developed at Imperial College London have been tested in real platforms since 2023–2024 and they were deployed aboard the Royal Navy research ship, the XV Patrick Blackett, the MV Anvil Point, the uncrewed submarine XV Excalibur and the P2000 patrol ship HMS Pursuer @royalnavy_quantum_2025.

The trial involved miniature cold atom systems, that as stated in the source the generation of cold atoms does not include an applied magnetic field, therefore reducing the size, weight, power consumption and cost of sensors. The experiments reported that the systems were highly accurate and remained stable over long periods of time. It is also noteworthy that these systems are resilient to spoofing attempts. A key factor in military applications.

=== Recent work
To examine further what the current status is, we investigated four recent studies. Wright et al. @wright2022 examine the physical principles, performance characteristics, and practical limitations of cold-atom inertial sensors for navigation applications. Their work details how stable and precise these sensors can be, while also discussing inherent limitations such as slow sampling and the down time needed for atom preparation. The need for cooling, preparation, measurement, and data collection in each measurement cycle means these particular sensors often function at just a few hertz, which is considerably slower than conventional MEMS (micro-electromechanical systems) or optical gyroscopes. The restricted bandwidth makes them less appropriate for environments experiencing extensive motion and vibration. System intricacies, including their physical dimensions and delicate nature, are also barriers, especially for deployment on unmanned platforms. Furthermore, vacuum apparatus, precise lasers, and atomic preparation components are more complex than other types of sensors such as the typical solid-state ones.

The Salducci et al. @salducci2024sciadv address these challenges experimentally by demonstrating a compact accelerometer–gyroscope based on magnetically launched atoms. Magnetic launching enables long interrogation times within a reduced physical footprint, improving practicality and integration potential. Moreover, the authors demonstrate hybridization with classical inertial sensors, using the cold-atom instrument to correct drift and bias in conventional accelerometers and gyroscopes.

In addition to these works, the research by Chen et al. @chen2025 examines a system-level approach to integrating a single-axis cold-atom gyroscope into a classical inertial navigation system using numerical studies. Their findings indicate that even with restricted quantum sensing capacity, the system substantially lessens long-term heading and position mistakes, particularly when combined with an existing IMU. While this research does not directly engage with the practical difficulties of hardware, it does make clear that cold-atom sensors are primarily valuable as reference instruments.

Finally, Gersemann et al. @gersemann2025 provide a comprehensive review of recent developments toward practical quantum inertial navigation systems based on Bose–Einstein–condensate atom interferometers, published in Applied Physics Reviews. Their study focuses not only on sensing principles but also on the engineering challenges associated with field deployment, including compact vacuum architectures, robust laser systems, multi-axis measurement geometries, and long-term operational stability. The authors discuss how improved atomic coherence and extended interrogation times enabled by condensate sources can enhance sensitivity and reduce drift, while also highlighting constraints related to system complexity, size, and measurement cycle duration. Importantly, the work emphasizes hybrid quantum–classical integration strategies, where cold-atom sensors serve as low-drift references that periodically calibrate conventional IMUs. This perspective reinforces the view that cold-atom interferometers are most effective as high-accuracy reference instruments rather than standalone navigation sensors for dynamic platforms.

=== Conclusion
The evidence across these studies leads us to a consistent finding regarding drone and mobile platform applications. Cold-atom inertial sensors, when compared with older methods, tend to show better long-term stability, offer more precise bias control, and provide greater absolute accuracy. Low sampling rates, dead time, sensitivity to vibration, and system complexity currently present challenges that prevent them from being used as independent navigation solutions, especially for highly dynamic platforms. Despite the experiments conducted by Imperial College London and the Royal Navy, all this recent research suggests that cold-atom devices will likely not replace classical IMUs in the near future. Instead, the most reasonable way forward seems to be architectures that blend quantum and classical elements. Those hybrid quantum-classical architectures represent a more pragmatic and impactful application for the predictable future. Within these systems, cold-atom sensors can be used as reference tools with minimal drift, regularly adjusting for bias and drift in standard sensors @wright2022, @salducci2024sciadv, @chen2025 while at the same time, classical sensors can provide high-bandwidth motion tracking. 

== Optical quantum gyroscopes<secOptGyro>
The next two chapters, will examine how the already existing FOG (Fiber Optic Gyroscopes) can be upgraded into optical quantum gyroscopes that are essentially an updated version of the old Sagnac-based rotation sensors that are currently in use. The improvement here lies on making them more sensitive and stable over time, while preserving their well established advantages. Instead of swapping out the usual optical interferometers for totally new sensing parts, these systems actually bring in special optical resources like "squeezed" or "entangled" light. The idea here is to dial down the measurement noise, getting it even lower than what's normally possible with shot-noise or the standard quantum limit. Among the advantages that are preserved are how much info they can deliver, the high frequency rates, and their tough build. In other words, the effort is to make the phase-readout sensitivity better in navigation systems that are already in use and by enriching them with quantum characteristics while keeping them compact and  ideal for small, moving platforms.

In a conventional optical gyroscope, two counter-propagating light fields circulate in a closed loop. Rotation induces a differential phase shift between the two beams via the Sagnac effect, and this phase difference is measured interferometrically. The ultimate sensitivity is limited by photon shot noise, which arises from the quantum statistics of light detection. Increasing laser power can improve sensitivity, but practical limits such as detector saturation, nonlinear optical effects, and thermal noise constrain this approach. This classical physics barrier is called the standard quantum limit (SQL) and scales as: $ 1/sqrt(N) $ where N is the number of detected photons. Optical quantum gyroscopes can go beyond this limit by preparing the optical field in non-classical quantum states that shift noise between the phase and amplitude quadratures. By injecting squeezed vacuum light into a classical interferometer,  phase noise has proven to be reduced. More analytically, A highly stable laser source produces a coherent optical field. The beam is divided into two identical components that will propagate in opposite directions through the interferometer loop. The two beams travel around a closed optical path, typically implemented either as a long fiber coil (in fiber-optic gyroscopes), a ring resonator, or an integrated photonic waveguide loop. Without rotation, both beams travel the same optical distance and end up with the same phase. When the device spins, the optical path length changes because the beam moving in the same direction as the rotation ends up traveling a bit farther, while the beam going against the rotation travels a bit less. This difference causes a slight phase shift between the two beams, based on the Sagnac relation. After completing the loop, the two beams are recombined at a photodetector or interferometric readout stage. The resulting interference signal converts the phase difference into an optical intensity variation that can be measured electronically. Optical quantum gyroscopes upgrade the performance by preparing the optical field in non-classical quantum states before it enters the interferometer. One common strategy is the Squeezed-light injection, where a squeezed vacuum state is injected into the interferometer to reduce noise in the phase quadrature while increasing noise in the amplitude quadrature. Because the rotation measurement depends only on phase, this redistribution of quantum uncertainty allows phase noise to drop below the SQL.
Another approach is the entangled interferometry (SU(1,1) schemes), where in nonlinear interferometer architectures, quantum correlations between optical modes are generated internally through parametric amplification processes. These correlations also enhance phase sensitivity beyond classical scaling limits. Here, it is necessary to mention that SU(1,1) interferometers can surpass the SQL under ideal conditions, but noise and loss prevent true Heisenberg scaling (∝ 1/N).
In both approaches, the interferometric output signal exhibits a higher signal-to-noise ratio for the same optical power, allowing smaller rotation-induced phase shifts to be resolved. The underlying sensing mechanism remains the classical Sagnac interferometer. The quantum resources do not change the physical observable (rotation-induced phase shift) but instead improve the precision with which this phase can be measured. For examining this approach, three recent papers have been evaluated.

=== Recent work
Chang et al. @chang2022 analyze the use of squeezed-light injection in dispersive microcavity gyroscopes, demonstrating theoretically that quantum noise reduction can substantially enhance phase sensitivity when optical losses are low. Their results show that microcavity-enhanced interaction lengths combined with squeezed input states may provide measurable improvements over classical shot-noise-limited performance. The principal strength of this work lies in its compatibility with compact photonic platforms and its clear route toward chip-scale integration. However, the analysis also highlights a basic key limitation which is the performance gains degradation with optical loss, meaning that realistic coupling and propagation losses can significantly diminish any achievable quantum advantage.

In the second reviewed paper, Zhao et al. @zhao2023apl proposes and analyzes SU(1,1) or entangled Sagnac interferometer configurations. Here, nonlinear optical processes replace classical beam splitters and generate quantum correlations internally within the interferometer. In this architecture, amplification and sensing occur simultaneously, allowing the rotation-induced phase to be encoded in correlated optical modes and enabling sensitivity scaling beyond the SQL under ideal conditions. The main strength of this approach is its intrinsic robustness to certain detection inefficiencies and the possibility of higher parametric gain compared to simple squeezing injection. Nevertheless, the scheme introduces considerable experimental complexity, requiring nonlinear optical elements and precise phase control, which currently limits practical deployment in real-world applications. This is a central finding of the paper, as it shows that using this type of hardware in mobile unmanned platforms is impractical.

Finally, Iu et al. @iu2025cleo reported an experimental demonstration of a quantum enhanced Sagnac gyroscope, where a kilometer scale long fiber loop and an integrated squeezed-light source were used. This paper is a significantly important work, as it provides one of the first practical validations that quantum resources can measurably improve gyroscope performance. The results show reduction in Allan variance (AVAR) of approximately 2–3 dB beyond the classical shot-noise limit. It is also worth mentioning that, the experiment was conducted in a realistic and commercially available fiber based platform, highlighting immediate compatibility with existing technologies. At the same time, the observed improvement remains modest, and the results emphasize that fiber loss, technical noise, and stability of the squeezing source strongly constrain the net benefit, indicating that engineering challenges still dominate system-level performance. A schematic representation of a optical quantum gyroscope and its performance scaling is shown in @figureOQG.

#figure(
  image("Images/Optical quantum gyro.png", width: 100%),
  caption: [Schematic diagram of an optical quantum gyroscope (a), evolution of the sensing error δΩ in the presence of photon loss under the Born-Markovian approximation (b), numerical fitting of the scale relation between the global minimum of δΩ and the photon number (c). Figure cited from @oqgimage ]
)<figureOQG>

=== Conclusion
Taken together, these studies demonstrate that it is possible to retain the so far achieved maturity and bandwidth of classical optical interferometers while at the same time reduce their readout noise and enhance measurable sensitivity. Their principal strengths include continuous operation, room-temperature functionality, high sampling rates, and straightforward integration with established fiber or photonic technologies. However, the achievable quantum advantage is typically modest and highly sensitive to optical loss, imperfect mode matching, and technical noise sources. Moreover, generating and maintaining squeezed or entangled light introduces additional system complexity that partially offsets the simplicity of purely classical optical gyroscopes. Moreover, two additional drawbacks are present. The fact that these systems do not measure linear accelerations and the fact that they can not be used as a replacement of the existing gyroscopes. They are rather introduced as a quantum enhancement to already mature technologies. Consequently, their most realistic near-term role in navigation systems, especially for mobile platforms such as drones, is a quantum enhanced version of the classical fiber optic gyroscopes, in an attempt to preserve the compactness and reliability required for field deployment.

== Atom–light hybrid gyroscopes<secALHQG>
Atom–light hybrid gyroscopes (ALHQGs) are another technology presented in this paper. They are an emerging class of quantum rotation sensors that combine the complementary advantages of optical interferometry with the atomic quantum coherence. Purely optical gyroscopes offer high bandwidth, robustness, and mature engineering platforms, while cold-atom interferometers provide intrinsically low drift and high phase sensitivity. Hybrid approaches seek to integrate both advantages within a single architecture. By combining optical Sagnac interferometers to atomic ensembles, ALHQGs attempt to surpass rotational sensitivity classical limits while preserving the compactness and continuous operation of optical systems. This combination makes hybrid schemes conceptually attractive for navigation applications where both stability and bandwidth are required.

ALHQG systems have emerged as devices highly sensitive to rotation. The setup typically includes an optical Sagnac loop that couples the rotation rate to the optical field, and an atomic ensemble that serves as a quantum beam splitter and recombiner (QBS(C)). In this scheme, an atomic Raman-amplification process produces the splitting and subsequent recombination of the optical wave and the atomic spin wave. As the loop rotates, the waves undergo a phase shift that increases in proportion to the rotation rate. The circulating optical field is then coupled to an atomic ensemble while maintaining phase coherence, most often through Raman transitions or related light–matter interactions. During these interactions, the optical phase maps onto collective atomic spin-wave excitations, producing quantum correlations between the photon field and the atomic ensemble. In this setup, the atomic ensemble functions as a quantum-enhanced beam splitter and as a phase memory, allowing the sensing protocol to use both optical and matter degrees of freedom. This hybrid approach can increase access to phase information while reducing measurement noise and, in principle, may allow sensitivities beyond the pre-mentioned standard quantum limit. More analytically, the sensing process can be described through a sequence of stages. First, a coherent optical field generated by a stabilized laser source is injected into a closed interferometric loop, typically implemented as a fiber coil or optical resonator. Two optical waves propagate in opposite directions around the loop. When the system undergoes rotation, the Sagnac effect induces a small phase difference between these counter-propagating waves. Next, the optical field interacts with an atomic ensemble through Raman transitions that couple the optical field to collective atomic states. During this interaction, part of the optical phase information is transferred to the atomic ensemble in the form of a collective spin-wave excitation. This process effectively creates correlations between the optical field and the atomic states, enabling the system to operate as a hybrid interferometer that combines optical and atomic sensing mechanisms. As the interferometer evolves, the rotation-induced phase shift is encoded in both the optical mode and the atomic spin-wave excitation. Because the atomic ensemble can preserve coherence over relatively long timescales, it can function as a quantum memory that temporarily stores phase information. This allows the sensing protocol to exploit both optical and atomic degrees of freedom when estimating the rotation rate. Finally, the optical and atomic modes are recombined through additional Raman interactions or optical readout processes. The resulting interference signal converts the accumulated phase difference into a measurable optical intensity variation or atomic population imbalance. These signals can be detected using photodetectors or atomic-state readout techniques. The atoms are held in place and interact through their internal states, rather than moving along free-fall paths. Therefore, ALHQGs do not require the large interrogation regions or extensive vacuum systems typical of cold-atom interferometers. Since the optical loop maintains the high sampling rate and mechanical robustness typical of conventional fiber- or cavity-based gyroscopes, atom–light hybrid systems occupy an intermediate position between purely optical methods and purely matter-wave interferometers in terms of design and practical implementation. Using the same approach described above, we will examine the two most recent papers.

=== Recent work
Starting with Wu et al. @wu2020prapplied as the initial point of reference for this review, the authors present one of the earliest theoretical proposals for atom–light gyroscopes. This paper describes how Raman-coupled atomic ensembles placed in a Sagnac interferometer can produce atom–light entanglement and increase rotational phase sensitivity beyond the classical scaling limit. Their analysis indicates that the hybrid interference signal draws on both optical path length and atomic coherence at the same time, and it may exceed the performance of classical fiber-optic gyroscopes of similar size. This work is strongest in its clear physical framework and its quantitative sensitivity estimates, which support ALHQGs as a viable approach for sensing. Notwithstanding, the proposal in general is mostly theoretical. Putting it into practice requires strong, stable atom–light coupling and low optical loss. Both of these are difficult to achieve in experiments.

Building on this concept, Yu et al. @yu2022su11 studied SU(1,1)-type nonlinear interferometry in hybrid atom–light systems. Their approach replaces passive beam splitters with correlated amplification stages, with the goal of improving phase sensitivity while reducing the impact of some forms of detection loss. The results suggest that asymmetric gain tuning and nonlinear interactions can increase quantum enhancement while reducing some of the inefficiencies that often limit squeezed-light schemes. This approach supports flexible hybrid architectures and offers a broad range of design options, but it also adds complexity. In particular, it may require nonlinear optical components and tight control of parametric gain, which can make it harder to integrate into compact devices intended for field deployment.

=== Conclusion
Experiments using different quantum links between atoms and light keep revealing longer stability periods along with tighter interactions, especially in small setups. This trend suggests a potential path toward practical quantum sensors. Yet work on integrated atom-light gyroscopes is still rare, with most findings confined to lab-only demonstrations. Altogether, today's studies indicate these gyroscopes hold strong potential when placed beside existing inertial detectors. Instead of cold atom interferometers, such systems may sidestep falling-related problems, shrink physical dimensions, while enabling nonstop operation. Unlike optical quantum gyroscopes, the ALHQG adds atomic coherence as a second quantum element. That could mean better detection of phase changes along with steadier readings. Still, getting those benefits isn't straightforward. One issue is how well light and atoms interact and how this tends to shift when surroundings change. Another problem shows up in maintaining that atomic coordination under real conditions. Then there's design difficulty: using two kinds of quantum effects at once demands lasers plus microwaves working together and with high timing precision. Alignment must be exact, or performance drops. This could mean heavier systems and higher energy needs. This is the reason atom-light quantum hybrid gyroscopes exist mostly in labs. Although they combine high-bandwidth optical readouts with steady output from atomic ones, these devices are less developed than cold atom or pure optical quantum versions. Undoubtedly they show potential, yet still fall short for real-world navigation use. Only after solving issues like signal loss, performance limits, and hardware blending might such gadgets become small, working tools - sitting neatly between wave-based and light-driven spin detectors.

== Spin defects<secSpinDefects>
Another technology that we examine in the context of quantum navigating tools is based on spin defects. Recently, a lot of discussion emerged as this technology is presented as a major factor in the rescue operation of a downed US pilot @quantuminsider_pilot_2026. Even though the validation of this theory is not verified, this technology could enable beacon-style navigation paradigms based on the detection of extremely weak signals in the environment, or at least demonstrate the sensitiveness of the measured data. If real, such approaches would depend critically on advanced signal processing methods capable of isolating low-amplitude signatures from noise and interference in complex operational conditions.
More analytically, these spin defects take the form of small solid-state units centered on groups of light-sensitive imperfections - often nitrogen–vacancy (NV) centers found in diamond - attached directly to the device being tracked @kim2025. Built into these systems are several key elements. A laser is used to prepare spins and enable optical readout of the emitted fluorescence. Microwave circuitry paired with an antenna or cavity handles precise control of spin states. Light routing relies on mirrors, fibers, lenses, or embedded optical paths rather than bulk setups. Detection happens through sensors or imaging arrays capable of tracking photon emissions over time @fullyintegrateddnv2024. Without the need for vacuum chambers, laser cooling, or falling atoms, such devices sidestep complexities tied to atomic interferometry. Their operation hinges on long-lived spin behavior within solids, stable even at room temperature. This allows creation of durable, space-efficient quantum detectors naturally suited for portable or power-limited applications like the unmanned platforms we examine @kim2025, @wang2025pra.
The process is initiated with light at around 532 nm, nudging nitrogen–vacancy centers into a specific spin condition via optical excitation. Following this step, microwave signals - delivered with precise timing - set up overlapping spin configurations that shift gradually. As these spins drift freely, surrounding influences tweak how fast they rotate. Their behavior respond to heat changes or distortions in the crystal lattice but most importantly they are strongly affected by magnetic fields. Such effects slowly alter the phase within the spinning arrangement @kim2025.
A single microwave pulse at the end transforms stored phase information into a detectable imbalance across spin states, revealed by light emission tied to spin orientation. Depending on how bright the signal appears, researchers infer shifts in spin distribution, making fine magnetic field detection possible via optical monitoring of resonance effects - frequently refined through methods that track phase changes carefully.
Instead of tracking motion straight from movement, nitrogen-vacancy sensors detect shifts in local magnetic fields during travel. When a vehicle advances, its path exposes it to changing elements of Earth's magnetism across locations, leaving behind distinct patterns recorded at specific moments. Such timestamped readings match up later with known geomagnetic charts @jukic2024spie or combine with traditional IMU inputs to limit error buildup @graham2025 while refining location and directional guesses. So, once again the technology is not mature enough to replace older tools. These quantum-enabled devices serve more like references or steady points giving the ability to adjust mechanical systems mid-journey.

=== Recent work
The first paper we examine is Li et al. @fullyintegrateddnv2024. This work focuses on the practical miniaturization and integration of nitrogen–vacancy sensing hardware into a compact solid-state platform. The authors present a fully integrated diamond magnetometer that combines optical excitation, microwave control, photo-detection, and signal-processing electronics within a single device architecture. By eliminating bulky free-space optics and external subsystems, their design reduces size, power consumption, and alignment sensitivity while maintaining competitive magnetic-field sensitivity. This level of integration demonstrates that NV-based quantum sensors can move beyond laboratory-scale optical benches toward robust, portable modules suitable for embedded and mobile applications, thereby addressing key engineering barriers that traditionally limit quantum sensing technologies.

Complementary to this hardware-focused effort, Graham et al. @graham2025 investigate the performance of diamond magnetometers under realistic operating conditions outside the laboratory. Their study evaluates sensor behavior during vehicle-mounted experiments, where motion, vibration, and environmental disturbances are unavoidable. The results show that NV-based magnetometers retain stable operation and useful sensitivity during continuous movement, enabling reliable measurement of spatial magnetic-field variations in dynamic environments. The authors further demonstrate that these measurements can support navigation-related tasks, such as magnetic mapping and drift mitigation. This work provides practical evidence that solid-state spin-defect sensors are not only compact but also sufficiently resilient for deployment in field and navigation scenarios.

Recent reports have suggested potential operational use of quantum sensing technologies in defense scenarios. In particular, a 2026 media report described a rescue operation in which such a quantum sensor may have been used to detect the heartbeat of a downed pilot at a distance, enabling localization in a GNSS-denied environment @quantuminsider_pilot_2026. While such claims remain unverified and are subject to significant scientific skepticism, they highlight the growing interest in applying quantum sensing techniques beyond laboratory settings. This specific example indicates that quantum magnetometry might allow for extremely sensitive detections such as capturing biological signals under noisy conditions. Of course the process indicates that the subject's heartbeat signature had been pre-recorded in advance. Still, practical deployment in complex, real-world environments remains a question due to noise, signal attenuation, and sensitivity constraints. Nevertheless, this advancement if real, could lead to a beacon using navigation. At the moment, these reports should be interpreted as indicative of emerging interest rather than evidence of mature operational capability.

=== Conclusion
When combined, these findings reveal not only the promise but also the practical limits of navigation tools based on spin defects. Compared to other quantum based interferometers, solid-state NV sensors are easily deployable, they require less space and energy, and can withstand physical stress well enough for operation on moving vehicles. Nevertheless, their performance often depends on nearby magnetic influences, the stability of ambient fields, and access to accurate geomagnetic data. Work on NV centers operating without added bias fields shows what may be achievable, yet also highlights persistent challenges when applying vector magnetometers outside controlled laboratory environments @biasfieldfree2025. Here it is worth mentioning that, in this case also a different path emerges through system integration: NV magnetometers provide stable background references that periodically correct drift in conventional inertial devices without replacing them entirely. This combination leverages the long-term stability of quantum measurements while preserving the fast response and direct motion tracking of classical sensors @kim2025, @wang2025pra. A comparative overview of the examined quantum sensing technologies is presented in @figKartes.

#let badge(fillc, txt) = box(
  fill: fillc,
  stroke: none,
  radius: 99pt,
  inset: (x: 7pt, y: 2pt),
)[#text(size: 9pt)[#txt]]

#let card(fillc, title, body) = box(
  stroke: 0.8pt,
  radius: 7pt,
  inset: 10pt,
  fill: fillc,
)[
  *#title* \
  #v(6pt)
  #body
]

#let zone(title, body) = box(
  stroke: 1pt,
  radius: 10pt,
  inset: 12pt,
)[
  *#title* \
  #v(8pt)
  #body
]

#figure(
  caption: [Quantum sensing technologies for inertial navigation.],

  stack(
    spacing: 12pt,

    grid(
      columns: (1fr, 1fr),
      gutter: 12pt,

      zone(
        [Inertial sensing (linear + rotation)],
        card(
          rgb(255, 235, 150),
          [❄️ Cold-atom inertial sensors],
          [
            #badge(rgb(207,226,255), [Linear + rotation]) #h(6pt) \
            #badge(rgb(207,226,255), [Absolute reference]) #h(6pt) \
            #badge(rgb(207,226,255), [Ultra-low drift / bias])  #h(6pt) \
            #badge(rgb(255,217,217), [Low bandwidth])  #h(6pt) \
            #badge(rgb(255,217,217), [Needs vacuum and lasers])  #h(6pt) \
            #badge(rgb(255,217,217), [Pulsed, dead time])  #h(6pt) \
          ]
        )
      ),

      zone(
        [Magnetic-field aiding (map-dependent)],
        card(
          rgb(200, 240, 210),
          [💎 Spin-defect sensors (NV)],
          [
            #badge(rgb(207,226,255), [High bandwidth]) #h(6pt) \
            #badge(rgb(207,226,255), [Robust and compact])  #h(6pt) \
            #badge(rgb(207,226,255), [Smaller calibration burden])  #h(6pt) \
            #badge(rgb(255,217,217), [Indirect aiding]) #h(6pt) \
            #badge(rgb(255,217,217), [Map dependent]) #h(6pt) \
            #badge(rgb(255,217,217), [Sensitive to all kind of magnetic noise])  #h(6pt) \
          ]
        )
      ),
    ),

    zone(
      [Sagnac-based gyroscopes (rotation only)],
      grid(
        columns: (1fr, 1fr),
        gutter: 12pt,

        card(
          rgb(255,117,138),
          [🧬 Atom–light hybrid gyroscopes],
          [
            #badge(rgb(207,226,255), [Great sensitivity])  #h(6pt) \
            #badge(rgb(207,226,255), [Continuous or quasi-continuous readout]) #h(6pt)  \
            #badge(rgb(255,217,217), [Rotation only]) #h(6pt) \
            #badge(rgb(255,217,217), [Hybrid quantum]) #h(6pt) \
            #badge(rgb(255,217,217), [Early-stage])  #h(6pt) \
            #badge(rgb(255,217,217), [High complexity])  #h(6pt) \
          ]
        ),

        card(
          rgb(255, 235, 150),
          [🌀 Optical quantum gyroscopes],
          [
            #badge(rgb(207,226,255), [High bandwidth]) #h(6pt) \
            #badge(rgb(207,226,255), [No dead time])  #h(6pt) \
            #badge(rgb(207,226,255), [Compatible with FOG/ROG])  #h(6pt) \
            #badge(rgb(255,217,217), [Rotation only]) #h(6pt) \
            #badge(rgb(255,217,217), [Loss-limited gain])  #h(6pt) \
            #badge(rgb(255,217,217), [Technical noise dominates])  #h(6pt) \
          ]
        )
      )
    ),

    align(center)[
      #badge(rgb(207,226,255), [Advantages]) #h(8pt)
      #badge(rgb(255,217,217), [Limitations]) #h(8pt)
      #badge(rgb(200, 240, 210), [High maturity]) #h(8pt)
      #badge(rgb(255, 235, 150), [Medium maturity])
      #badge(rgb(255,117,138), [Low maturity])
    ]
  )
)<figKartes>

== Comparative drift simulation<secSimulation>
To complement the qualitative comparison above with a concrete, reproducible illustration of the drift-versus-bandwidth trade-off, an interactive dead-reckoning simulation ("Quantum INS methods comparison")#footnote[Source code, build instructions, and a live-runnable version are available at #link("https://github.com/DimitriosParaschos/Q-INS-simulation")[github.com/DimitriosParaschos/Q-INS-simulation].] was developed. It compares position and attitude estimation error across the four quantum sensing technologies discussed above, together with the classical MEMS IMU baseline and a fifth, composite hybrid-fusion configuration. Sensor bias is modelled using a first-order Gauss–Markov process and an angle/velocity random-walk term, following the standard noise decomposition used throughout the inertial-navigation literature @maybeck1979, @groves2013, @ieee952_1997 (full derivation in the Sensor Error Model subsection below). The simulation is a qualitative, pedagogically-motivated illustration of the drift-versus-bandwidth trade-off; it is not a metrologically validated INS error-propagation tool calibrated against real hardware. While the model structure follows standard inertial-navigation error analysis, the specific numerical parameter values (given in the Per-Sensor Parameterisation subsection below) remain relative severity scores chosen to produce qualitatively realistic, well-separated drift behaviour across sensor classes over typical demonstration flight times of 10–120 s, rather than values derived from manufacturer datasheets or Allan-variance measurements of physical hardware.

#heading(level: 4, numbering: (..) => "", outlined: false)[General simulation framework]
All five sensor configurations share one underlying motion and error-propagation framework; only the bias-instability, process-noise, and sample-rate parameters differ between them (the Per-Sensor Parameterisation subsection below gives the specific values used for each).

*Coordinate convention.* The simulation uses a right-handed Cartesian frame with X as lateral (east–west) displacement, Y as longitudinal (north–south) displacement, and Z as height above the ground plane, all in metres. Orientation is represented by three Euler angles—roll ($phi$), pitch ($theta$), and yaw ($psi$)—expressed in degrees in the user interface and converted to radians internally.

*True trajectory generation.* The "true" (ground-truth) trajectory represents the platform's actual physical flight path, which is identical regardless of which sensor is notionally "observing" it—a deliberate modelling choice so that the comparison isolates sensor error as the only variable. The platform follows a piecewise-linear route through an ordered list of waypoints $W = {w_1, w_2, ..., w_n}$, flying from its current position toward the next unreached waypoint at a constant nominal speed $v_0$:
$ dot(x)(t) = v_0 dot (w - x(t)) / norm(w - x(t)) + u(t) $<eqVelocity>
where $x(t) in RR^3$ is the current true position, $w$ is the position of the currently-targeted waypoint, $v_0 = 1.8$ m/s is the fixed nominal flight speed, and $u(t)$ is an optional wind-disturbance velocity vector (defined below). Position is integrated forward each simulation frame using a first-order explicit (Euler) step:
$ x(t + Delta t) = x(t) + dot(x)(t) dot Delta t $<eqPositionUpdate>
A waypoint is considered reached when the Euclidean distance to it falls below a tolerance of 0.12 m, at which point the platform advances to the next waypoint in the route, or the run terminates if the final waypoint has been reached.

*True attitude generation.* True yaw and pitch are derived kinematically from the instantaneous velocity direction, so the platform visually faces its direction of travel:
$ psi(t) = "atan2"(dot(x)_x (t), dot(x)_z (t)) $<eqYaw>
$ theta(t) = 0.6 dot "atan2"(dot(x)_y (t), sqrt(dot(x)_x^2 (t) + dot(x)_z^2 (t))) $<eqPitch>
Roll during free flight is a small open-loop sinusoidal sway, included only for visual realism and not coupled to the error model:
$ phi(t) = 0.05 dot sin(1.3 t) $<eqRoll>
During the final 25% of approach distance to each waypoint, true attitude is linearly blended—using shortest-angle interpolation for yaw, to avoid wraparound discontinuities at $plus.minus 180 degree$—from the kinematic travel-facing attitude toward the user-commanded final heading $(phi_t, theta_t, psi_t)$ specified for that waypoint, so the platform settles into the requested orientation on arrival:
$ alpha(t) = (1-b) dot alpha_"travel" (t) + b dot alpha_"target" \
  b = "clamp"[(p-0.75)/0.25, 0, 1] $<eqHeadingBlend>
where $alpha$ stands for each of $phi, theta, psi$ in turn, and $p = 1 - ("remaining distance")/("initial leg distance")$ is the fractional progress along the current leg.

*Environmental disturbance.* An optional constant disturbance vector $u$ may be added to the true velocity to perturb the flight path away from a straight line:
$ u = (U (r_x - 0.5), thin 0.3 U (r_y - 0.5), thin U (r_z - 0.5)) $<eqWind>
where $U$ is the user-set gust strength (m/s) and $r_x, r_y, r_z$ are independent uniform random draws on $[0,1)$, sampled once at the start of each run.

#heading(level: 4, numbering: (..) => "", outlined: false)[Sensor error model] <secErrorModel>
Each sensor's position and attitude estimate diverges from ground truth through a first-order Gauss–Markov (GM) bias process combined with an independent angle/velocity random-walk (ARW/VRW) term and a sample-rate-gated instantaneous measurement-noise floor. This is the same structural decomposition used in IEEE Std 952-1997 @ieee952_1997 and in standard inertial-navigation error-state formulations @groves2013.

Bias instability in a gyroscope or accelerometer is conventionally modelled as a first-order Gauss–Markov (Ornstein–Uhlenbeck) stochastic process @maybeck1979, @brown2012, with continuous-time stochastic differential equation
$ d b(t) / d t = - b(t) / T_c + w(t), quad w(t) tilde "white noise" $<eqGMSde>
where $T_c$ is the bias correlation time and $w(t)$ is a white-noise driving term. For elapsed time $t lt.double T_c$ the restoring term is negligible and $b(t)$ behaves approximately as a random walk; for $t gt.double T_c$ the process is stationary, with variance saturating at a steady-state value $sigma_"ss"^2$. A short $T_c$ describes a bias that wanders quickly (e.g. an inexpensive MEMS gyroscope); a long $T_c$ describes a bias that is highly stable from one moment to the next (e.g. a cold-atom interferometer used as a near-absolute reference).

For simulation, the continuous-time SDE of @eqGMSde is advanced using its exact discrete-time solution, valid for any frame duration $Delta t$ and standard in Kalman-filter implementations @brown2012, @groves2013:
$ b(k+1) = phi.alt dot b(k) + sqrt(1-phi.alt^2) dot sigma_"ss" dot zeta \
  phi.alt = exp(-Delta t / T_c) $<eqGMDiscrete>
where $zeta$ is a zero-mean, unit-variance random variate (defined below). This recursion is exact: for any $Delta t$, the resulting discrete-time process has precisely the autocorrelation and steady-state variance $sigma_"ss"^2$ implied by the continuous-time SDE.

The bias process $b(t)$ is treated as a rate-equivalent error and integrated once to obtain the accumulated position or attitude error it contributes. Rather than reporting a single, unconstrained Monte Carlo realisation of this integral, the simulation reports the theoretical standard deviation of that integral, which has an exact closed form for a Gauss–Markov process @maybeck1979:
$ "Var"[integral_0^t b(tau) d tau] = sigma_"ss"^2 dot [t - 2T_c (1-e^(-t/T_c)) \
  + (T_c/2)(1-e^(-2t/T_c))] $<eqGMVariance>
This expression exhibits the two physically expected regimes: for $t lt.double T_c$ it expands to approximately $sigma_"ss"^2 t^3 \/ (3T_c^2)$ (near-quadratic growth, consistent with an approximately-constant bias being doubly integrated over short windows); for $t gt.double T_c$ it grows asymptotically linearly in $t$ (so the standard deviation grows as $sqrt(t)$, the classical random-walk regime). An independent ARW/VRW contribution—representing genuine white noise on the rate signal rather than a slowly-varying bias—adds directly to the variance:
$ sigma(t) = [sigma_"ss"^2 dot B(t, T_c) + N^2 dot t]^(1/2) $<eqEnvelope>
where $B(t,T_c) := t - 2T_c(1-e^(-t/T_c)) + (T_c/2)(1-e^(-2t/T_c))$ repeats the bracketed term of @eqGMVariance, and $N$ is the sensor's ARW/VRW intensity (defined per sensor below). @eqEnvelope is the theoretical 1-$sigma$ error envelope that the simulation displays, charts, and logs.

To give the displayed trajectory organic, non-monotonic fine structure rather than tracing the smooth envelope of @eqEnvelope exactly, the simulation runs a continuously-evolving unit-$sigma_"ss"$ Gauss–Markov process (@eqGMDiscrete with $sigma_"ss"=1$) in parallel and uses its own running time-integral, normalised against its own theoretical envelope, as a bounded multiplier:
$ w(t) = "clamp"[I_"unit" (t) \/ sigma_"unit" (t), -1.6, 1.6] $<eqWobble>
where $I_"unit"(t)$ is the running integral of the live unit-$sigma_"ss"$ process and $sigma_"unit"(t)$ is @eqGMVariance evaluated at $sigma_"ss" = 1$. The displayed, charted, and logged error is then
$ b_"disp" (t) = w(t) dot sigma(t) $<eqDisplayedError>
This construction ensures the displayed error has genuine, continuously-evolving stochastic character while never exceeding $1.6 times$ nor falling outside $-1.6 times$ of the theoretical envelope $sigma(t)$, so two sensors whose theoretical envelopes differ by an order of magnitude or more cannot have their relative ranking inverted by chance on a single run.

Both $zeta$ in @eqGMDiscrete and the analogous variate driving the ARW contribution are generated as the recentred sum of three independent uniform draws (an Irwin–Hall approximation to a Gaussian):
$ zeta = 2 dot (U_1 + U_2 + U_3 - 1.5), quad U_i tilde "Uniform"(0,1) $<eqGaussianApprox>
scaled so that $"Var"[zeta] = 1$ exactly. This is a standard lightweight approximation that avoids the computational cost of an exact Box–Muller or Marsaglia transform.

In addition to @eqDisplayedError, each sensor reading carries an independent, non-accumulating instantaneous measurement-noise term, re-drawn only at the sensor's sample interval $Delta t_s = 1\/f_s$ rather than every simulation frame:
$ n tilde "Uniform"(-0.5,0.5) dot k_n dot N \
  "refreshed every" thin Delta t_s = 1\/f_s $<eqMeasNoise>
Between samples the most recently drawn value is held constant, modelling sensor dead-time: a low-rate sensor such as a cold-atom interferometer ($f_s approx 2$ Hz) refreshes only twice per second, versus $100 times$ more often for a 200 Hz MEMS IMU. @eqDisplayedError, by contrast, is updated every simulation frame regardless of sample rate, since the underlying bias process physically continues to evolve between discrete digital readouts; only the independent measurement-noise floor is sample-rate-limited.

The full estimated state for each axis is
$ hat(y)(t) = y(t) + b_"disp" (t) + n(t) $<eqEstimate>
applied independently to each of the six axes ($x,y,z$, roll, pitch, yaw), where $y(t)$ is the corresponding true value. Reported position error is the Euclidean norm of the three linear-axis errors:
$ e(t) = [(hat(y)_x - x)^2 + (hat(y)_y - y)^2 + (hat(y)_z - z)^2]^(1/2) $<eqPositionError>
and attitude errors are reported per axis in degrees, wrapped into $[-180 degree, 180 degree)$ to avoid reporting unbounded accumulated angle values:
$ Delta alpha_"deg" = ((Delta alpha dot 180/pi + 180) mod 360 + 360) \
  mod 360 - 180 $<eqAngleWrap>

#heading(level: 4, numbering: (..) => "", outlined: false)[Per-sensor parameterisation] <secParameterisation>
Each sensor configuration is fully specified by four base parameters: bias instability (steady-state standard deviation $sigma_("ss",0)$), correlation time $T_c$, ARW/VRW intensity $N_0$, and nominal sample rate $f_0$. The user interface exposes independent multiplicative sliders for bias and noise ($beta, nu$, each ranging $0.05 times$–$20 times$) and sample rate ($rho$, $0.1 times$–$5 times$) per active sensor, plus a mass-dependent multiplier $m(mu)$ (described below):
$ sigma_"ss" = sigma_("ss",0) dot beta dot m(mu) \
  N = N_0 dot nu dot m(mu) \
  f_s = max(0.5, f_0 dot rho) $<eqSliderMap>
with $T_c$ fixed per sensor. The mapping from a dimensionless relative severity score $B_0$ (@tabSensorParams) to the physical GM parameters uses fixed scaling constants with units chosen so that $sigma_("ss",0)$ and $N_0$ carry the units of a rate (m/s for position axes, rad/s for attitude axes), so that the variances in @eqGMVariance–@eqEnvelope are dimensionally consistent after integration:
$ sigma_("ss",0) = k_sigma dot B_0, quad N_0 = k_N dot B_0 $<eqScoreMap>
with $k_sigma = 2.6 times 10^(-3)$ m/s per unit $B_0$ (position axes) or $4.5 times 10^(-5)$ rad/s per unit $B_0$ (attitude axes), and $k_N = 2.8 times 10^(-4)$ m/s per unit $B_0$ (position axes) or $8.5 times 10^(-6)$ rad/s per unit $B_0$ (attitude axes). These constants were chosen so that a 60 s demonstration flight reproduces the qualitative drift magnitudes discussed above (MEMS on the order of 0.5–1 m; cold-atom on the order of millimetres).

#figure(
  caption: [Base parameter values used in the comparative drift simulation. $B_0$, $T_0$, and $f_0$ are relative severity scores calibrated for qualitative separation between sensor classes, not measured datasheet specifications, substituted into the Gauss–Markov structure described above.],
  text(
  size: 7pt,
  font: "Roboto",
  table(
    columns: (11em, 7em, 5em, 6em, 7em),
    align: (left, left),
    inset: (x: 8pt, y: 4pt),
    stroke: (x, y) => if y <= 1 { (top: 0.5pt) },
    fill: (x, y) => if y > 0 and calc.rem(y, 2) == 0 { rgb("#efefef") },
    table.header[*Sensor*][*$B_0$ (bias)*][*$T_0$ (s)*][*$f_0$ (Hz)*][*Maturity*],
    [Classical MEMS IMU], [50], [15], [200], [Deployed],
    [Cold-Atom Interferometer], [0.4], [60], [2], [Research],
    [NV-Center Magnetometer], [8], [25], [100], [Research],
    [Atom–Light Hybrid Gyro], [2], [35], [30], [Experimental],
    [Hybrid Fusion (MEMS+Cold-Atom)], [50 #super[a]], [15 #super[a]], [200 #super[a]], [Proposed],
  )
))<tabSensorParams>

#super[a] Hybrid Fusion uses the same base GM parameters as MEMS; its improvement comes entirely from the periodic correction mechanism described below, not from different underlying sensor characteristics.

*Classical MEMS IMU.* Represents a conventional micro-electromechanical-systems inertial measurement unit: high sample rate (200 Hz) and low cost, but the largest bias instability ($B_0=50$) of any configuration and the shortest correlation time ($T_c=15$ s), reflecting a bias that is both large in magnitude and decorrelates quickly rather than staying put. This is the simulation's baseline "worst case" against which the quantum-enabled alternatives are compared.

*Cold-atom interferometer.* Represents the cold-atom inertial sensor discussed in @secColdAtom: an ultra-low-drift absolute reference ($B_0=0.4$, a $125 times$ improvement over MEMS) with the longest correlation time of any configuration ($T_c=60$ s), reflecting extreme bias stability consistent with its description as a near-absolute reference. Its low sample rate ($f_0=2$ Hz) reflects the dead-time inherent to laser-cooling, free-fall interrogation, and state-selective readout cycles; the sensor's instantaneous noise floor refreshes only twice per second (@eqMeasNoise), independent of how slowly its bias process evolves.

*NV-center magnetometer.* Represents the nitrogen-vacancy spin-defect sensor of @secSpinDefects: room-temperature operation enables a moderate-to-high sample rate ($f_0=100$ Hz) with bias instability ($B_0=8$) and correlation time ($T_c=25$ s) both intermediate between MEMS and cold-atom, reflecting its role as an indirect, map-dependent drift-correction aid rather than a direct high-precision inertial reference.

*Atom–light hybrid gyroscope.* Represents the early-stage hybrid architecture of @secALHQG: intermediate sample rate ($f_0=30$ Hz), intermediate-to-low bias instability ($B_0=2$), and a correlation time ($T_c=35$ s) positioned between MEMS and cold-atom.

*Hybrid fusion (proposed architecture).* This fifth configuration illustrates a high-bandwidth classical sensor (MEMS-equivalent GM parameters) whose bias process is periodically corrected using a simulated low-drift cold-atom reference, analogous to a measurement-update step in a Kalman filter that fuses an absolute reference into a propagated estimate. At fixed intervals $T_"corr"$, the live GM state and its running integral are multiplicatively attenuated by a correction strength $kappa$, and the theoretical envelope (@eqEnvelope) is re-evaluated using elapsed time since the most recent correction rather than total flight time:
$ b_"GM" arrow.l (1-kappa) b_"GM" \
  I_"unit" arrow.l (1-kappa) I_"unit" \
  t_"eff" arrow.l t - t_"correction" $<eqFusionReset>
applied every $T_"corr"$ seconds, with $T_"corr" = 4$ s and $kappa = 0.85$ (an 85% reduction at each correction event). This produces a characteristic sawtooth error pattern in the drift-versus-time chart: error grows from zero following @eqEnvelope for up to four seconds, then drops sharply at each correction pulse and re-grows from the lower base, yielding a substantially lower time-averaged error than uncorrected MEMS while retaining MEMS's full 200 Hz bandwidth.

*Payload-mass noise penalty.* An optional, illustrative mass-dependent multiplier represents the intuition that a heavier sensor payload couples more vibration into the measurement and adds inertia the flight controller must compensate for. The user may set each sensor's payload mass $mu$ independently (default 1 kg for all sensors):
$ m(mu) = "clamp"[0.5 + 0.5 dot (mu\/mu_0), 0.5, 3] \
  mu_0 = 1"kg" $<eqMassPenalty>
bounded to $[0.5,3]$ to keep the effect illustrative rather than physically unbounded; this is not a validated aeroelastic or vibration-isolation model.

#heading(level: 4, numbering: (..) => "", outlined: false)[Results generation]
The simulation advances in real time using the browser's animation-frame callback (typically 60 Hz). At each callback, the elapsed wall-clock time since the previous frame ($Delta t$, clamped to a maximum of 0.05 s to guard against frame-rate stalls) is used to advance @eqPositionUpdate, @eqHeadingBlend, @eqGMSde, @eqGMVariance, and @eqWobble–@eqGaussianApprox for every active sensor simultaneously. In side-by-side comparison mode, each selected sensor maintains an independent state object, advanced through the identical sequence of equations with only $B_0, N_0, f_0$ substituted, so that any difference in outcome between sensors is attributable solely to the model parameters.

The drift-versus-time chart plots $e(t)$ from @eqPositionError against elapsed flight time for every active sensor, sampled at a fixed 0.15 s interval independent of each sensor's own sample rate. The vertical axis is linear in metres rather than logarithmic, so the roughly two-orders-of-magnitude separation between cold-atom and MEMS is visually apparent as a near-flat line for cold-atom against a steadily-rising line for MEMS.

On completion of a run (all waypoints reached by all active sensors), the final values of @eqPositionError–@eqAngleWrap are recorded as a run-log entry: total position error, per-axis linear error, per-axis attitude error, and total elapsed flight time, computed once directly from the final simulation state. For routes with more than one waypoint, each sensor independently tracks its own current-leg index; a leg transition is triggered purely by the true position's proximity to the current target. Because true position and flight speed are identical across all sensors, every sensor reaches each waypoint at the same simulated time in side-by-side mode, which keeps the comparison strictly isolated to estimation error rather than introducing artificial timing differences between sensors.

We note the following limitations of the simulation explicitly: it is a qualitative dead-reckoning illustration, not a validated strapdown INS error-propagation model with Kalman filtering or true IMU mechanization equations; the Gaussian approximation of @eqGaussianApprox is not an exact normal distribution; wind disturbance is a constant-bias vector rather than a time-varying turbulence model; and the payload-mass penalty of @eqMassPenalty is illustrative and not derived from vibration-isolation analysis. All sensors fly the identical true trajectory at the identical speed, so the simulation isolates and compares estimation error only.

= Results
This chapter is a comparative discussion of all the available quantum navigation technologies. A summary of their key characteristics is presented in @tabComparison. From a system view, these four quantum sensing methods looked at—cold-atom inertial sensors, spin-defect sensors, optical quantum gyroscopes, and atom–light hybrid gyroscopes—are different ways to deal with the limits of regular inertial navigation systems. Instead of all going toward one "universal" quantum IMU, studies show more support for mixed designs. In these, quantum sensors add certain benefits (like stable long-term performance, environmental data, or less readout noise), while regular IMUs still handle tracking fast movements.

Cold-atom inertial sensors give the most direct and basic ways to measure acceleration and rotation using matter-wave interference. Their main benefit is precise, drift-free sensing linked to atomic traits instead of mechanical parts. But, using them on moving platforms is limited through measurement cycles needed for trapping, cooling, and measuring. Wright and others say that current cold-atom sensors usually work at frequencies of about 0.5 Hz to a few Hz, with use times of around 0.3–0.5 @wright2022, @gersemann2025 and they also report ~1–10 Hz for newer clocked interferometers. Regular inertial sensors often work at hundreds of Hz. This mix of slow sampling and dead time makes it unsufficient to use them as standalone devices in places with much vibration or quick moves, like drones @schubert2021, @kwolek2021. Recent tests show why these sensors are still good as references: Salducci and others tell of a small cold-atom accelerometer–gyroscope setup with stable rotation-rate bias of about 4×10⁻⁷ rad/s and stable acceleration bias of about 7×10⁻⁷ m/s². It also has about 700 ppm gyroscope scale-factor stability over a day @salducci2024sciadv. They show a mix that makes regular sensor stability better (said to be about 100× for acceleration and about 3× for rotation in their mixed setup) @salducci2024sciadv, @chen2025. These results back up the close role of cold-atom sensors as low-drift references.

Spin-defect sensors work on a different principle. They do not measure inertial quantities directly. Instead, they give better sensing of disturbances in the magnetic field around them, which can be used to help navigation by matching pre loaded maps or by resetting the the accumulated drift in classical IMUs. Their main advantages are that they skip vacuum systems and laser cooling and that they can work all the time at room temperature, allowing for small and strong designs @kim2025. Recent work shows good levels of joining and acting: one NV magnetometer design reports about 390 pT/√Hz sensitivity, a small size of about 10.5 × 9.3 × 4.5 cm³, and about 10.2 W total power use @wang2025pra. Another design reports nanotesla sensitivity (down to about 2.14 nT/√Hz) with adjustable bandwidth (about 1.3–625 Hz) in a small shape of about Φ13 cm × 26 cm @fullyintegrateddnv2024, @dai2025integratednv. They have been used in real field tests: a portable vector diamond magnetometer worked on moving platforms and got an unshielded mean sensitivity of about 0.5 ± 0.1 nT/√Hz in the 10–150 Hz range @graham2025. The vector/feedback setup had lower-frequency sensitivities reported around 140–210 nT/√Hz (0.1–0.66 Hz) with a vector sampling rate of about 1.3 Hz in their order @graham2025. These results mean that NV sensors are really good as helping or reference sensors. They can give stable clues from the area (mainly geomagnetic signs) and fix drift sometimes. But, their navigation act depends a lot on magnetic clean areas, steady areas, and good geomagnetic maps @jukic2024spie, @biasfieldfree2025.

Optical quantum gyroscopes are a small quantum step up from older Sagnac-based optical gyro tech. They want to do better than the shot-noise-limited readout act of regular fiber-optic or resonant gyroscopes by using non-regular optical states (like squeezed light or entanglement). They also keep major good parts of optical gyros: working all the time, room-temperature use, and high bandwidth. In theory, these ways can give big sensitivity gains in low-loss areas @chang2022, @sun2023qong. For example, studying squeezed-light shots in dispersive microcavity gyroscopes say big gains under good loss areas @chang2022. SU(1,1)-type entangled Sagnac plans also try to give quantum links that make phase sensitivity better @zhao2023apl, but they add more parts and control work linked to nonlinear optical parts and phase keeping. The main limit is that quantum gain is very open to loss and tech noise. So, optical quantum gyroscopes are better thought of as quantum-added parts of regular optical gyros, not a totally new inertial sensing idea.

Atom–light hybrid gyroscopes (ALHQGs) are in the middle and more looked at spot between optical and atomic ways. By joining an optical Sagnac loop to an atomic set, they want to mix the bandwidth and made skill of optical loops with atom-based link and quantum links. The key hope is to beat the regular quantum limit through joined atom–light studying while skipping free-falling atomic lines. Current work is still mainly theory or early time, with focus on sensitivity scaling and strong points under loss and bad joining @wu2020prapplied, @yu2022su11. SU(1,1)-type hybrid studying has also been studied as a way to cut loss while still gaining nonlinear quantum gain @yu2022su11. Though, it adds design work and tight control needs. So, atom–light hybrid gyroscopes are better seen as a good search way, not a close deployable navigation sensor for drones.

Taken all together, these techs show that at the moment, there is no quantum sensing way right now that meets all needs for single inertial navigation on drones. Cold-atom sensors give great long-term unchanging but are limited through slow sample rates and working dead time @wright2022, @gersemann2025, @schubert2021, @kwolek2021. NV sensors are small and fieldable but they are vulnerable to exterior parameters and mapping @kim2025, @jukic2024spie, @dai2025integratednv. Optical quantum gyros keep bandwidth but face real limits from loss and work @chang2022, @sun2023qong, @zhao2023apl. Atom–light hybrids are still early @wu2020prapplied, @yu2022su11. The most agreed idea is a mixed way. Quantum sensors add certain strong things—absolute unchanging, area data, or less readout noise—while regular IMUs still give high-rate sampling and quick GNSS-denied use.

= Discussion

From what we have seen so far, it becomes clear that a reliable and easy to deploy quantum sensing technology can not be driven by the emergence of a single dominant solution, but rather by the complementary strengths of different approaches. A combination oriented perspective is needed: high-bandwidth systems such as spin-defect sensors and optical quantum gyroscopes can effectively compensate for the low sampling rates and dead-time limitations of cold-atom interferometers, while cold-atom sensors can provide stable, drift-free reference measurements that enhance long-term navigation accuracy. The hybridization approach is also enhanced from recent studies. One such paradigm is the demonstrated improvements of 2–3 dB reduction in Allan variance in quantum-enhanced optical gyroscopes and up to two orders of magnitude improvement in acceleration stability when cold-atom sensors are integrated with classical inertial systems.

Currently, trends show efforts of transitioning from lab models to setups ready for actual use. Chip-sized microcavity gyroscopes, along with diamond magnetometers built entirely on one piece, highlight strides in shrinking devices - cutting down size, weight, and energy needs vital for drones and vehicles. Meanwhile, tests on moving platforms reveal quantum sensors handling rough, changing outdoor settings better than before, hinting they're becoming tougher, easier to carry out into the field. Still, hurdles remain despite such steps forward. For example, combining atoms and light inside gyroscopes demands stronger interaction between them, less wasted light, smoother links across parts if they ever hope to go past early trial phases.

@tabSensitivity summarizes the best‑reported sensitivities and stability metrics for each quantum sensing approach, including a classical fiber‑optic gyroscope (FOG) for reference. Cold‑atom instruments currently offer the highest absolute accuracy, with sensitivities at the 10⁻⁹ rad/s / √Hz level, followed by atom–light hybrids and optical quantum gyroscopes, which achieve incremental improvements (≈ 2–3 dB) beyond shot‑noise‑limited classical gyroscopes. Spin‑defect sensors provide nanotesla‑scale magnetic resolution rather than direct inertial readout, supporting drift correction instead of full navigation. This quantitative comparison reinforces the conclusion that no single quantum device presently fulfills all inertial‑navigation requirements, but hybrid combinations can merge their complementary strengths.

At the moment, the most prominent approach seems to be the mixing old and new designs as the way ahead. Instead of swapping out traditional inertial tools, quantum methods will likely boost them - bringing things like steady output over time, better surroundings detection, so too sharper readings. Right there, down the line, navigation's next step lives in blending quantum detectors with standard gear: pairing ultra-stable signals from quantum sources alongside quick-reacting, well-tested classic parts to keep systems working strong when GPS drops off. The comparative drift simulation described in @secSimulation provides a concrete, reproducible illustration of this trade-off: a high-bandwidth sensor whose accumulated bias is periodically corrected by a low-drift reference achieves substantially lower time-averaged error than either component alone, directly visualising the hybrid quantum–classical integration strategy argued for throughout this section.

@figSimMemsVsNv shows two representative simulation runs flown over the identical four-waypoint route at the identical speed, isolating estimation error as the only variable. The classical MEMS configuration accumulates 6.39 m of position error over a 19.6 s flight, with the estimated (red) path visibly diverging from the true (green) flight path soon after launch; the position-error chart below it grows steadily over the whole flight, consistent with the random-walk-like growth predicted by @eqEnvelope for a short correlation time. The NV-center configuration, flown over the same route in a comparable time, accumulates only 0.08 m—roughly two orders of magnitude lower—with the estimated and true paths remaining visually coincident throughout. This two-order-of-magnitude separation is the simulation's direct illustration of the drift-instability gap between classical and quantum-aided sensing discussed throughout @secColdAtom–@secSpinDefects.

#figure(
  image("Images/mems_vs_nvcenter.png", width: 92%),
  caption: [Representative simulation runs over an identical route: classical MEMS IMU (top, 6.39 m final error) versus NV-center magnetometer (bottom, 0.08 m final error). Green: true flight path. Red/purple: sensor-estimated path. Lower panels show position error accumulating over the flight.]
)<figSimMemsVsNv>

@figSimFusion shows the Hybrid Fusion configuration flown over the same route. The characteristic sawtooth pattern predicted analytically above (around @eqFusionReset) is directly visible in the error chart: position error grows for approximately four seconds following the Gauss–Markov envelope of @eqEnvelope, then drops sharply as each simulated cold-atom correction pulse re-zeroes the accumulated bias, repeating for the duration of the flight. The final error (0.83 m) sits below uncorrected MEMS despite using identical underlying bias and noise parameters, and is achieved without sacrificing MEMS's 200 Hz update rate—a concrete demonstration of the hybrid quantum–classical strategy this section argues is the most realistic near-term path forward.

#figure(
  image("Images/fusion_run.png", width: 92%),
  caption: [Hybrid Fusion configuration over the same route as @figSimMemsVsNv. The sawtooth error pattern (lower panel) results from periodic cold-atom-reference correction pulses every 4 s, each removing 85% of the accumulated Gauss–Markov bias.]
)<figSimFusion>

#figure(
  caption: [Comparison of quantum sensing technologies for navigation],
  text(
  size: 7pt,
  font: "Roboto",
 
  table(
    columns: (6em, 6em, 6em, 6em, 6em),
    align: (left, left),
    inset: (x: 8pt, y: 4pt),
    stroke: (x, y) => if y <= 1 { (top: 0.5pt) },
    fill: (x, y) => if y > 0 and calc.rem(y, 2) == 0 { rgb("#efefef") },
  
    table.header[*Aspect*][*Cold-atom*][*Spin-defect*][*Optical gyros*][*Atom–light gyros*],

    [Physical platform],
    [Free-falling atomic clouds in vacuum],
    [Solid-state crystal defects],
    [Optical fiber loops or resonant cavities],
    [Optical interferometer coupled to atomic ensemble],

    [Quantum resource],
    [Matter-wave interference],
    [Solid-state spin coherence],
    [Non-classical light (squeezing, entanglement)],
    [Atom–light quantum correlations],

    [Temperature],
    [Microkelvin / nanokelvin],
    [Room temperature],
    [Room temperature],
    [Room temperature],

    [Measurement],
    [Pulsed],
    [Continuous],
    [Continuous],
    [Continuous],

    [Sampling rate],
    [Low (Hz)],
    [Medium (KHz)],
    [High (MHz)],
    [Medium (KHz)],

    [Direct sensing],
    [Yes],
    [No],
    [Yes],
    [Yes],

    [Complexity],
    [High],
    [Low–medium],
    [Medium],
    [High],

    [Robustness],
    [Limited],
    [High],
    [High],
    [Medium],

    [Maturity],
    [Research],
    [Deployment],
    [Research],
    [Experimental],

    [Strengths],
    [Ultra low drift, high accuracy],
    [Compact, robust, high bandwidth],
    [Quantum-enhanced sensitivity with optical robustness],
    [Combines atomic coherence with optical bandwidth],

    [Limitations],
    [Low bandwidth, dead time, SWaP],
    [Indirect sensing, map dependent],
    [Loss sensitivity, modest quantum gain],
    [Decoherence, coupling complexity],

    [Realistic role],
    [Reference sensor in hybrid INS],
    [Drift correction],
    [Quantum-enhanced classical gyro],
    [Exploratory hybrid quantum INS],
  )
))<tabComparison>

#figure(
  caption: [Sensitivity and performance comparison of quantum sensing technologies for navigation],
  text(
  size: 7pt,
  font: "Roboto",

  table(
  columns: (8em, 8em, 8em, 8em),
  align: (left, left),
  stroke: (x, y) => if y <= 1 { (top: 0.5pt) },
  inset: (x: 8pt, y: 4pt),
  fill: (x, y) => if y > 0 and calc.rem(y, 2) == 0 { rgb("#efefef") },

  [*Method*], [*Measured Quantity*], [*Best Sensitivity*], [*Typical Accuracy / Stability*],

  [Cold-atom accelerometer],
  [Linear acceleration],
  [$10^(-8)$-$10^(-9)$ m/s²/√Hz],
  [$< 10$ μg absolute accuracy],

  [Cold-atom gyroscope],
  [Rotation rate],
  [$10^(-9)$ rad/s/√Hz],
  [$10^(-10)$ rad/s long-term stability],

  [Optical quantum gyroscope],
  [Rotation rate],
  [$10^(-7)$ rad/s/√Hz],
  [Few dB improvement over classical],

  [Atom–light hybrid gyroscope],
  [Rotation rate],
  [< $10^(-7)$ rad/s/√Hz],
  [Not yet experimentally established],

  [Spin-defect (NV) magnetometer],
  [Magnetic field],
  [$10^(-12)$ T/√Hz],
  [nT-level in field conditions],

  [Classical FOG (for reference)],
  [Rotation rate],
  [$10^(-6)$ rad/s/√Hz],
  [High stability, mature],
  )
))<tabSensitivity>

#emph(text(black)[
  Conflict of Interest: The authors declare that there are no known competing financial interests or personal relationships that could have appeared to influence the work reported in this paper.
])

#emph(text(black)[
  Ethics Statement: No human participants, human data, or animal subjects were involved in this study. Ethical approval and informed consent were therefore not required.
])

#emph(text(black)[
  Data Availability Statement: No new experimental data were created or analyzed in this study. The source code for the comparative drift simulation described in Section II.E is openly available at #link("https://github.com/DimitriosParaschos/Q-INS-simulation")[github.com/DimitriosParaschos/Q-INS-simulation].
])

#emph(text(black)[
  Funding: This research received no external funding.
])

= Appendix: Glossary of Simulation Symbols
@tabGlossary lists every symbol used in the description of the comparative drift simulation (@secSimulation).

#figure(
  caption: [Glossary of symbols used in @secSimulation.],
  text(
  size: 7pt,
  font: "Roboto",
  table(
    columns: (10em, 16em, 9em),
    align: (left, left),
    inset: (x: 8pt, y: 4pt),
    stroke: (x, y) => if y <= 1 { (top: 0.5pt) },
    fill: (x, y) => if y > 0 and calc.rem(y, 2) == 0 { rgb("#efefef") },
    table.header[*Symbol*][*Meaning*][*Units (sim.)*],

    [$x(t)$], [True position vector $(x,y,z)$ at time $t$], [m],
    [$hat(y)(t)$], [Estimated (sensor-derived) value of a state variable], [m or rad],
    [$v_0$], [Nominal constant flight speed], [1.8 m/s (fixed)],
    [$u(t)$], [Wind disturbance velocity vector], [m/s],
    [$U$], [User-set wind gust strength], [m/s],
    [$phi, theta, psi$], [Roll, pitch, yaw Euler angles], [rad (internal), ° (UI)],
    [$b$], [Fractional blend toward commanded final heading on approach], [dimensionless, [0,1]],
    [$b(t)$], [Live first-order Gauss–Markov bias process (unit $sigma_"ss"$)], [dimensionless rate],
    [$sigma_"ss", sigma_("ss",0)$], [Effective and base GM steady-state standard deviation], [m/s or rad/s],
    [$T_c$], [GM bias correlation time (fixed per sensor)], [s],
    [$phi.alt$], [Exact GM discrete-time decay factor, $exp(-Delta t/T_c)$], [dimensionless, [0,1]],
    [$N, N_0$], [Effective and base angle/velocity random-walk (ARW/VRW) intensity], [m/s or rad/s],
    [$sigma(t)$], [Closed-form theoretical 1-$sigma$ error envelope], [m or rad],
    [$I_"unit"(t)$], [Running integral of the live unit-$sigma_"ss"$ GM process], [dimensionless],
    [$w(t)$], [Bounded stochastic wobble multiplier, clamped to $plus.minus 1.6$], [dimensionless],
    [$b_"disp"(t)$], [Displayed/charted/logged accumulated error], [m or rad],
    [$n(t)$], [Instantaneous measurement-noise term, held between samples], [m or rad],
    [$f_s, f_0$], [Effective and base sensor sample rate], [Hz],
    [$beta, nu, rho$], [User slider multipliers for bias, noise, sample rate], [dimensionless],
    [$k_sigma, k_N$], [Fixed scaling constants converting $B_0$ into $sigma_("ss",0), N_0$], [m/s or rad/s per unit $B_0$],
    [$zeta$], [Approximately-Gaussian zero-mean unit-variance random variate], [dimensionless],
    [$T_"corr"$], [Hybrid-fusion correction interval], [4 s (fixed)],
    [$kappa$], [Hybrid-fusion correction strength (fraction removed per pulse)], [0.85 (fixed)],
    [$mu, mu_0$], [User-set and reference payload mass], [kg ($mu_0=1$ kg)],
    [$m(mu)$], [Mass-dependent noise multiplier], [dimensionless, [0.5, 3]],
    [$e(t)$], [Total reported position error (Euclidean norm)], [m],
  )
))<tabGlossary>

#bibliography("References.bib", style: "ieee")
