import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Before;
import org.junit.Test;
import org.ontodia.server.core.data.*;

/**
 * Created by yuemelyanov on 27.06.2014.
 */
public class SerializationTest {

    @Before
    public void setup() {
        mapper = new ObjectMapper();
    }

    ObjectMapper mapper;

    @Test
    public void canSerializeLabel() throws JsonProcessingException {
        System.out.println(mapper.writeValueAsString(new Label(new StringLiteral[0])));
    }

    @Test
    public void canSerializeLiteral() throws JsonProcessingException {
        System.out.println(mapper.writeValueAsString(new TypedLiteral("date", "2014-01-01")));
    }

    @Test
    public void canSerializeElement() throws JsonProcessingException {
        StringLiteral literal = new StringLiteral("One", "en");

        System.out.println(mapper.writeValueAsString(
                new ElementType(new Id("123"),
                        new Label(new StringLiteral[] {literal})
                )
        ));

    }
}
