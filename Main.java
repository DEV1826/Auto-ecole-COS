import java.util.ArrayList;
import java.util.List;
import java.util.Random;

class Cheval implements Runnable {

    private String nom;
    private int distance = 0;

    private static final int DISTANCE = 1000;

    private static List<String> classement = new ArrayList<>();

    private Random random = new Random();

    public Cheval(String nom) {
        this.nom = nom;
    }

    @Override
    public void run() {

        while (distance < DISTANCE) {

            int pas = random.nextInt(10) + 1;

            distance += pas;

            if (distance > DISTANCE) {
                distance = DISTANCE;
            }

            System.out.println(
                nom + " avance de " + pas +
                "m | Position : " + distance + "m"
            );

            try {
                // Pause de 100 ms
                Thread.sleep(100);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                System.out.println(nom + " interrompu !");
                return;
            }
        }

        // un seul thread à la fois
        synchronized (classement) {

            classement.add(nom);

            System.out.println(
                "- " + nom +
                " termine à la position " +
                classement.size()
            );
        }
    }

    // Méthode pour récupérer le classement final
    public static List<String> getClassement() {
        return classement;
    }
}

public class Main {

    public static void main(String[] args) throws InterruptedException {

        Thread c1 = new Thread(new Cheval("Nana"));
        Thread c2 = new Thread(new Cheval("Tchoffo"));

        // Démarrage des threads
        c1.start();
        c2.start();


        // Attendre la fin 
        c1.join();
        c2.join();

        System.out.println("\n------------------CLASSEMENT FINAL ------------------");

        List<String> classement = Cheval.getClassement();

        for (int i = 0; i < classement.size(); i++) {

            System.out.println(

               "-----" + (i + 1) + "ᵉ place : " + classement.get(i) + "-----"
            );
        }

        System.out.println("\nTous les chevaux ont terminé !");
    }
}